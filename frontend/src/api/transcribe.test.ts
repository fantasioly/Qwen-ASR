import { describe, it, expect } from 'vitest'
import { validateFile } from '@/api/transcribe'

/**
 * Create a mock File object with a controllable size property.
 * The real File API doesn't accept size as a constructor param,
 * so we override the size property on the instance.
 */
function createMockFile(
  name = 'test.wav',
  size = 1024,
  type = 'audio/wav',
): File {
  const file = new File(['dummy'], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

describe('validateFile', () => {
  it('returns valid: true for supported WAV format', () => {
    const file = createMockFile('audio.wav', 1024)
    const result = validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('returns valid: true for all 7 supported formats', () => {
    const formats = ['wav', 'mp3', 'mp4', 'm4a', 'ogg', 'flac', 'webm']
    for (const ext of formats) {
      const file = createMockFile(`audio.${ext}`, 1024, 'audio/*')
      const result = validateFile(file)
      expect(result.valid, `Extension ${ext} should be valid`).toBe(true)
    }
  })

  it('returns valid: true for uppercase extension (case-insensitive)', () => {
    const file = createMockFile('audio.WAV', 1024)
    const result = validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('returns valid: true for mixed-case extension', () => {
    const file = createMockFile('audio.Mp3', 1024)
    const result = validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('rejects unsupported TXT format with reason', () => {
    const file = createMockFile('readme.txt', 1024, 'text/plain')
    const result = validateFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Unsupported format')
    }
  })

  it('rejects unsupported PDF format with reason', () => {
    const file = createMockFile('document.pdf', 1024, 'application/pdf')
    const result = validateFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Unsupported format')
    }
  })

  it('rejects files exceeding 50MB size limit', () => {
    const file = createMockFile('large.wav', 51 * 1024 * 1024)
    const result = validateFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('too large')
    }
  })

  it('accepts files at exactly 50MB boundary', () => {
    const file = createMockFile('exact.wav', 50 * 1024 * 1024)
    const result = validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('accepts files just below 50MB boundary', () => {
    const file = createMockFile('almost.wav', 50 * 1024 * 1024 - 1)
    const result = validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('rejects files just above 50MB boundary', () => {
    const file = createMockFile('over.wav', 50 * 1024 * 1024 + 1)
    const result = validateFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('too large')
    }
  })

  it('checks size even for supported formats', () => {
    const file = createMockFile('huge.wav', 100 * 1024 * 1024, 'audio/wav')
    const result = validateFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('too large')
    }
  })

  it('rejects file with no extension', () => {
    const file = createMockFile('noext', 1024, 'audio/wav')
    const result = validateFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Unsupported format')
    }
  })
})
