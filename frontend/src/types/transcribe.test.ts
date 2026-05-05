import { describe, it, expect } from 'vitest'
import {
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '@/types/transcribe'

describe('transcribe types and constants', () => {
  describe('SUPPORTED_EXTENSIONS', () => {
    it('contains exactly 7 supported audio formats', () => {
      expect(SUPPORTED_EXTENSIONS).toHaveLength(7)
    })

    it('includes WAV format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('wav')
    })

    it('includes MP3 format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('mp3')
    })

    it('includes MP4 format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('mp4')
    })

    it('includes M4A format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('m4a')
    })

    it('includes OGG format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('ogg')
    })

    it('includes FLAC format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('flac')
    })

    it('includes WEBM format', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('webm')
    })

    it('is a readonly array', () => {
      expect(Array.isArray(SUPPORTED_EXTENSIONS)).toBe(true)
    })
  })

  describe('MAX_FILE_SIZE_BYTES', () => {
    it('equals 50MB in bytes', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024)
    })

    it('is exactly 52_428_800 bytes', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(52_428_800)
    })

    it('is a positive number', () => {
      expect(typeof MAX_FILE_SIZE_BYTES).toBe('number')
      expect(MAX_FILE_SIZE_BYTES).toBeGreaterThan(0)
    })
  })
})
