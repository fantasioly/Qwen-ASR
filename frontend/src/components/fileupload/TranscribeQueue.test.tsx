import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TranscribeQueue from '@/components/fileupload/TranscribeQueue'
import { type TranscribeJob } from '@/types/transcribe'

function createMockFile(
  name = 'test.wav',
  size = 1024,
  type = 'audio/wav',
): File {
  const file = new File(['dummy'], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

function createJob(
  name = 'audio.wav',
  status: TranscribeJob['status'] = 'queued',
  progress = 0,
): TranscribeJob {
  return {
    file: createMockFile(name, 2048),
    status,
    progress,
    ...(status === 'failed'
      ? { error: { error: 'test_error', message: 'Test error message', code: 500 } }
      : {}),
  }
}

describe('TranscribeQueue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('empty state', () => {
    it('shows empty message when no jobs', () => {
      render(<TranscribeQueue jobs={[]} isProcessing={false} />)
      expect(screen.getByText('No files in queue')).toBeInTheDocument()
    })
  })

  describe('status labels', () => {
    it('shows "Waiting..." for queued status', () => {
      render(<TranscribeQueue jobs={[createJob('a.wav', 'queued', 0)]} isProcessing={false} />)
      expect(screen.getByText('Waiting...')).toBeInTheDocument()
    })

    it('shows "Uploading..." for uploading status with progress', () => {
      render(<TranscribeQueue jobs={[createJob('a.wav', 'uploading', 50)]} isProcessing={true} />)
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows "Processing..." with spinner for processing status', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'processing', 75)]} isProcessing={true} />,
      )
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows checkmark and "Complete" for complete status', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'complete', 100)]} isProcessing={false} />,
      )
      expect(screen.getByText('Complete')).toBeInTheDocument()
      expect(container.querySelector('.text-green-600')).toBeInTheDocument()
    })

    it('shows error message for failed status', () => {
      render(
        <TranscribeQueue jobs={[createJob('a.wav', 'failed', 30)]} isProcessing={false} />,
      )
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('renders blue bar for uploading status', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'uploading', 40)]} isProcessing={true} />,
      )
      const bar = container.querySelector('.bg-blue-500')
      expect(bar).toHaveStyle({ width: '40%' })
    })

    it('renders blue bar for processing status', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'processing', 80)]} isProcessing={true} />,
      )
      const bar = container.querySelector('.bg-blue-500')
      expect(bar).toHaveStyle({ width: '80%' })
    })

    it('renders green bar for complete status', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'complete', 100)]} isProcessing={false} />,
      )
      const bar = container.querySelector('.bg-green-500')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('renders red bar for failed status', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'failed', 25)]} isProcessing={false} />,
      )
      const bar = container.querySelector('.bg-red-500')
      expect(bar).toHaveStyle({ width: '25%' })
    })
  })

  describe('label colors', () => {
    it('queues have gray label text', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'queued', 0)]} isProcessing={false} />,
      )
      const label = container.querySelector('.text-gray-400')
      expect(label).toBeInTheDocument()
    })

    it('uploading has blue label text', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'uploading', 50)]} isProcessing={true} />,
      )
      expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
    })

    it('complete has green label text', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'complete', 100)]} isProcessing={false} />,
      )
      expect(container.querySelector('.text-green-600')).toBeInTheDocument()
    })

    it('failed has red label text', () => {
      const { container } = render(
        <TranscribeQueue jobs={[createJob('a.wav', 'failed', 25)]} isProcessing={false} />,
      )
      expect(container.querySelector('.text-red-500')).toBeInTheDocument()
    })
  })

  describe('filename and size', () => {
    it('renders filename with size in KB', () => {
      render(
        <TranscribeQueue jobs={[createJob('audio.wav', 'queued', 0)]} isProcessing={false} />,
      )
      expect(screen.getByText(/audio\.wav/)).toBeInTheDocument()
      expect(screen.getByText(/2KB/)).toBeInTheDocument()
    })
  })

  describe('multiple jobs', () => {
    it('renders each job independently with correct status', () => {
      const jobs = [
        createJob('first.wav', 'uploading', 50),
        createJob('second.mp3', 'complete', 100),
        createJob('third.flac', 'queued', 0),
      ]
      render(<TranscribeQueue jobs={jobs} isProcessing={true} />)
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
      expect(screen.getByText('Waiting...')).toBeInTheDocument()
    })

    it('shows percentage only for uploading and processing jobs', () => {
      const jobs = [
        createJob('a.wav', 'uploading', 60),
        createJob('b.mp3', 'processing', 85),
        createJob('c.flac', 'complete', 100),
      ]
      render(<TranscribeQueue jobs={jobs} isProcessing={true} />)
      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument()
    })
  })
})
