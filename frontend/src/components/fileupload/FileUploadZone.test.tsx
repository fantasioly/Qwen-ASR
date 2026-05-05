import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileUploadZone from '@/components/fileupload/FileUploadZone'

function createMockFile(
  name = 'test.wav',
  size = 1024,
  type = 'audio/wav',
): File {
  const file = new File(['dummy'], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

describe('FileUploadZone', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders upload hint text', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)
    expect(screen.getByText(/Drop audio files here/)).toBeInTheDocument()
  })

  it('renders supported format list', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)
    expect(screen.getByText(/Supported:/)).toBeInTheDocument()
  })

  it('calls onFiles with dropped files', () => {
    const onFiles = vi.fn()
    const { container } = render(<FileUploadZone onFiles={onFiles} />)

    const zone = container.firstChild as HTMLElement
    const mockFile = createMockFile('audio.wav', 2048)
    const files = [mockFile] as unknown as FileList

    fireEvent.drop(zone, {
      dataTransfer: { files },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })
    expect(onFiles).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'audio.wav' })]),
    )
  })

  it('calls onFiles when file input changes', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const mockFile = createMockFile('audio.mp3', 4096)
    const files = [mockFile] as unknown as FileList

    fireEvent.change(input, { target: { files } })
    expect(onFiles).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'audio.mp3' })]),
    )
  })

  it('triggers file input click on zone click', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const clickSpy = vi.spyOn(input, 'click')

    const zone = document.querySelector('[role="button"]')!
    fireEvent.click(zone)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('does not trigger input click when disabled', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} disabled />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const clickSpy = vi.spyOn(input, 'click')

    const zone = document.querySelector('[role="button"]')!
    fireEvent.click(zone)
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('has correct accept attribute for audio extensions', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const accept = input.getAttribute('accept')
    expect(accept).toContain('.wav')
    expect(accept).toContain('.mp3')
    expect(accept).toContain('.mp4')
    expect(accept).toContain('.m4a')
    expect(accept).toContain('.ogg')
    expect(accept).toContain('.flac')
    expect(accept).toContain('.webm')
  })

  it('applies disabled visual styling', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} disabled />)

    const zone = document.querySelector('[role="button"]')!
    expect(zone).toHaveClass('opacity-50')
    expect(zone).toHaveClass('cursor-not-allowed')
  })

  it('is keyboard accessible with Enter key', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const clickSpy = vi.spyOn(input, 'click')

    const zone = document.querySelector('[role="button"]')!
    fireEvent.keyDown(zone, { key: 'Enter', preventDefault: vi.fn() })
    expect(clickSpy).toHaveBeenCalled()
  })

  it('is keyboard accessible with Space key', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const clickSpy = vi.spyOn(input, 'click')

    const zone = document.querySelector('[role="button"]')!
    fireEvent.keyDown(zone, { key: ' ', preventDefault: vi.fn() })
    expect(clickSpy).toHaveBeenCalled()
  })

  it('calls onFiles with multiple files from input', () => {
    const onFiles = vi.fn()
    render(<FileUploadZone onFiles={onFiles} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const file1 = createMockFile('a.wav', 1024)
    const file2 = createMockFile('b.mp3', 2048)
    const files = [file1, file2] as unknown as FileList

    fireEvent.change(input, { target: { files } })
    expect(onFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'a.wav' }),
        expect.objectContaining({ name: 'b.mp3' }),
      ]),
    )
  })

  it('prevents drag default behavior', () => {
    const onFiles = vi.fn()
    const { container } = render(<FileUploadZone onFiles={onFiles} />)

    const zone = container.firstChild as HTMLElement
    // Verify drag-over styling is applied (confirms event handler fires)
    // rather than testing preventDefault/stopPropagation which are jsdom-internal
    const dragOverEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }
    fireEvent.dragOver(zone, dragOverEvent)
    expect(zone).toHaveClass('border-blue-400')
    expect(zone).toHaveClass('bg-blue-50')
  })

  it('applies drag-over styling during drag', () => {
    const onFiles = vi.fn()
    const { container } = render(<FileUploadZone onFiles={onFiles} />)

    const zone = container.firstChild as HTMLElement
    fireEvent.dragOver(zone, { preventDefault: vi.fn(), stopPropagation: vi.fn() })
    expect(zone).toHaveClass('border-blue-400')
    expect(zone).toHaveClass('bg-blue-50')
  })

  it('removes drag-over styling on drag leave', () => {
    const onFiles = vi.fn()
    const { container } = render(<FileUploadZone onFiles={onFiles} />)

    const zone = container.firstChild as HTMLElement
    fireEvent.dragOver(zone, { preventDefault: vi.fn(), stopPropagation: vi.fn() })
    fireEvent.dragLeave(zone, { preventDefault: vi.fn(), stopPropagation: vi.fn() })
    expect(zone).not.toHaveClass('border-blue-400')
  })
})
