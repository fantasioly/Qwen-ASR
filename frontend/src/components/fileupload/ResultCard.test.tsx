import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResultCard from '@/components/fileupload/ResultCard'
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
const defaultResult = {
  text: 'Hello world, this is a transcription.',
  language: 'en',
  usage: { prompt_tokens: 120, completion_tokens: 15 },
  processing_time_ms: 1234,
}

function createJob(overrides: Partial<TranscribeJob> = {}): TranscribeJob {
  return {
    file: createMockFile('audio.wav', 2048),
    status: 'complete',
    progress: 100,
    result: defaultResult,
    ...overrides,
  }
}

describe('ResultCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error - stubbing navigator.clipboard
    globalThis.navigator.clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    }
  })

  afterEach(() => {
    // @ts-expect-error - cleanup
    delete globalThis.navigator.clipboard
  })

  describe('success state', () => {
    it('renders filename', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.getByText('audio.wav')).toBeInTheDocument()
    })

    it('renders language badge', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.getByText('en')).toBeInTheDocument()
    })

    it('renders transcription text', () => {
      render(<ResultCard job={createJob()} />)
      expect(
        screen.getByText('Hello world, this is a transcription.'),
      ).toBeInTheDocument()
    })

    it('renders prompt token count', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.getByText('Prompt: 120 tokens')).toBeInTheDocument()
    })

    it('renders completion token count', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.getByText('Completion: 15 tokens')).toBeInTheDocument()
    })

    it('renders processing time in header', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.getByText('1s')).toBeInTheDocument()
    })

    it('renders processing time as ms in stats bar', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.getByText(/Time: 1234ms/)).toBeInTheDocument()
    })

    it('renders language badge for Chinese', () => {
      render(
        <ResultCard
          job={createJob({
            result: {
              text: '你好世界',
              language: 'zh',
              usage: { prompt_tokens: 10, completion_tokens: 5 },
              processing_time_ms: 500,
            },
          })}
        />,
      )
      expect(screen.getByText('zh')).toBeInTheDocument()
    })

    it('renders correct duration for 3456ms', () => {
      render(
        <ResultCard
          job={createJob({
            result: {
              ...defaultResult,
              processing_time_ms: 3456,
            },
          })}
        />,
      )
      expect(screen.getByText('3s')).toBeInTheDocument()
    })
  })

  describe('no speech detected', () => {
    it('shows placeholder when text is empty', () => {
      render(
        <ResultCard
          job={createJob({
            result: {
              text: '',
              language: 'unknown',
              usage: { prompt_tokens: 5, completion_tokens: 0 },
              processing_time_ms: 100,
            },
          })}
        />,
      )
      expect(screen.getByText('No speech detected')).toBeInTheDocument()
    })

    it('shows placeholder when text is whitespace only', () => {
      render(
        <ResultCard
          job={createJob({
            result: {
              text: ' \t\n ',
              language: 'unknown',
              usage: { prompt_tokens: 5, completion_tokens: 0 },
              processing_time_ms: 100,
            },
          })}
        />,
      )
      expect(screen.getByText('No speech detected')).toBeInTheDocument()
    })
  })

  describe('failed state', () => {
    it('renders error message in red card', () => {
      const job = createJob({
        status: 'failed',
        progress: 40,
        error: { error: 'connection_failed', message: 'Cannot connect to server', code: 503 },
      })
      const { container } = render(<ResultCard job={job} />)
      expect(screen.getByText('Cannot connect to server')).toBeInTheDocument()
      expect(container.querySelector('.border-red-200')).toBeInTheDocument()
      expect(container.querySelector('.bg-red-50')).toBeInTheDocument()
    })

    it('shows default error text when error is missing', () => {
      const job = createJob({
        status: 'failed',
        progress: 40,
        error: undefined,
      })
      render(<ResultCard job={job} />)
      expect(screen.getByText('Transcription failed')).toBeInTheDocument()
    })
  })

  describe('copy to clipboard', () => {
    it('renders copy button', () => {
      render(<ResultCard job={createJob()} />)
      const copyBtn = screen.getByRole('button', { name: /Copy transcription text/i })
      expect(copyBtn).toBeInTheDocument()
    })

    it('copies text to clipboard on click', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined)
      // @ts-expect-error - stubbing clipboard
      globalThis.navigator.clipboard = { writeText: writeTextSpy }

      render(<ResultCard job={createJob()} />)
      const copyBtn = screen.getByRole('button', { name: /Copy transcription text/i })
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(writeTextSpy).toHaveBeenCalledWith(
          'Hello world, this is a transcription.',
        )
      })
    })

    it('copies empty string when result is missing', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined)
      // @ts-expect-error - stubbing clipboard
      globalThis.navigator.clipboard = { writeText: writeTextSpy }

      const job = createJob({ result: undefined })
      render(<ResultCard job={job} />)
      const copyBtn = screen.getByRole('button', { name: /Copy transcription text/i })
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(writeTextSpy).toHaveBeenCalledWith('')
      })
    })

    it('handles clipboard error gracefully', async () => {
      const writeTextSpy = vi.fn().mockRejectedValue(new Error('clipboard denied'))
      // @ts-expect-error - stubbing clipboard
      globalThis.navigator.clipboard = { writeText: writeTextSpy }

      render(<ResultCard job={createJob()} />)
      const copyBtn = screen.getByRole('button', { name: /Copy transcription text/i })
      fireEvent.click(copyBtn)
      // Should not throw — just shows toast error
      await waitFor(() => {
        expect(writeTextSpy).toHaveBeenCalled()
      })
    })
  })

  describe('remove button', () => {
    it('renders remove button when onRemove provided', () => {
      const onRemove = vi.fn()
      render(<ResultCard job={createJob()} onRemove={onRemove} index={2} />)
      const removeBtn = screen.getByRole('button', { name: /Remove result/i })
      expect(removeBtn).toBeInTheDocument()
    })

    it('calls onRemove with correct index', () => {
      const onRemove = vi.fn()
      render(<ResultCard job={createJob()} onRemove={onRemove} index={5} />)
      const removeBtn = screen.getByRole('button', { name: /Remove result/i })
      fireEvent.click(removeBtn)
      expect(onRemove).toHaveBeenCalledWith(5)
    })

    it('does not render remove button without onRemove', () => {
      render(<ResultCard job={createJob()} />)
      expect(screen.queryByRole('button', { name: /Remove result/i })).not.toBeInTheDocument()
    })
  })

  describe('stats with null usage', () => {
    it('renders zero tokens when usage is null', () => {
      render(
        <ResultCard
          job={createJob({
            result: {
              text: 'test',
              language: 'en',
              usage: null,
              processing_time_ms: 500,
            },
          })}
        />,
      )
      expect(screen.getByText('Prompt: 0 tokens')).toBeInTheDocument()
      expect(screen.getByText('Completion: 0 tokens')).toBeInTheDocument()
      expect(screen.getByText('Time: 500ms')).toBeInTheDocument()
    })
  })
})
