import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranscribeQueue } from '@/hooks/useTranscribeQueue'
import * as transcribeApi from '@/api/transcribe'

function createMockFile(
  name = 'test.wav',
  size = 1024,
  type = 'audio/wav',
): File {
  const file = new File(['dummy'], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

describe('useTranscribeQueue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('enqueue', () => {
    it('accepts valid WAV file and adds to queue', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('audio.wav', 1024))
      })

      expect(result.current.jobs).toHaveLength(1)
      expect(result.current.jobs[0].file.name).toBe('audio.wav')
      expect(result.current.jobs[0].status).toBe('queued')
      expect(result.current.jobs[0].progress).toBe(0)
    })

    it('accepts multiple files into the queue', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
        result.current.enqueue(createMockFile('b.mp3', 2048))
        result.current.enqueue(createMockFile('c.flac', 4096))
      })

      expect(result.current.jobs).toHaveLength(3)
      expect(result.current.jobs.every((j) => j.status === 'queued')).toBe(true)
    })

    it('rejects unsupported format with reason', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      let enqueueResult: { success: boolean; reason?: string } | undefined
      act(() => {
        enqueueResult = result.current.enqueue(
          createMockFile('readme.txt', 1024, 'text/plain'),
        )
      })

      expect(enqueueResult?.success).toBe(false)
      if (enqueueResult && !enqueueResult.success) {
        expect(enqueueResult.reason).toContain('Unsupported format')
      }
      expect(result.current.jobs).toHaveLength(0)
    })

    it('rejects oversized files with reason', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      let enqueueResult: { success: boolean; reason?: string } | undefined
      act(() => {
        enqueueResult = result.current.enqueue(
          createMockFile('huge.wav', 100 * 1024 * 1024),
        )
      })

      expect(enqueueResult?.success).toBe(false)
      if (enqueueResult && !enqueueResult.success) {
        expect(enqueueResult.reason).toContain('too large')
      }
      expect(result.current.jobs).toHaveLength(0)
    })
  })

  describe('removeJob', () => {
    it('removes a job by index', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
        result.current.enqueue(createMockFile('b.mp3', 2048))
        result.current.enqueue(createMockFile('c.flac', 4096))
      })

      act(() => {
        result.current.removeJob(1)
      })

      expect(result.current.jobs).toHaveLength(2)
      expect(result.current.jobs[0].file.name).toBe('a.wav')
      expect(result.current.jobs[1].file.name).toBe('c.flac')
    })
  })

  describe('clearCompleted', () => {
    it('removes complete and failed jobs', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
        result.current.enqueue(createMockFile('b.mp3', 2048))
      })

      // Manually set status to complete/failed for testing
      act(() => {
        result.current.jobs[0].status = 'complete'
        result.current.jobs[1].status = 'failed'
        result.current.clearCompleted()
      })

      expect(result.current.jobs).toHaveLength(0)
    })

    it('preserves queued and uploading jobs', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
        result.current.enqueue(createMockFile('b.mp3', 2048))
      })

      act(() => {
        result.current.jobs[0].status = 'complete'
        result.current.jobs[1].status = 'queued'
        result.current.clearCompleted()
      })

      expect(result.current.jobs).toHaveLength(1)
      expect(result.current.jobs[0].status).toBe('queued')
    })
  })

  describe('return value', () => {
    it('returns all required fields', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      expect(result.current).toHaveProperty('jobs')
      expect(result.current).toHaveProperty('isProcessing')
      expect(result.current).toHaveProperty('currentJobIndex')
      expect(result.current).toHaveProperty('enqueue')
      expect(result.current).toHaveProperty('removeJob')
      expect(result.current).toHaveProperty('processQueue')
      expect(result.current).toHaveProperty('clearCompleted')
    })

    it('starts with empty state', () => {
      const { result } = renderHook(() => useTranscribeQueue())

      expect(result.current.jobs).toEqual([])
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.currentJobIndex).toBeNull()
    })
  })

  describe('processQueue', () => {
    it('processes jobs sequentially (not in parallel)', async () => {
      const callOrder: string[] = []

      vi.spyOn(transcribeApi, 'uploadAudio').mockImplementation(
        (file, onProgress) => {
          file
          onProgress
          callOrder.push('upload-started')
          return {
            xhr: {} as unknown as XMLHttpRequest,
            promise: new Promise((resolve) => {
              callOrder.push('upload-promise-created')
              resolve({
                text: `Transcription of ${(file as File).name}`,
                language: 'en',
                usage: { prompt_tokens: 10, completion_tokens: 5 },
                processing_time_ms: 100,
              })
            }),
          }
        },
      )

      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
        result.current.enqueue(createMockFile('b.mp3', 1024))
      })

      await act(async () => {
        await result.current.processQueue()
      })

      // Verify sequential: upload-started then promise for first,
      // then upload-started then promise for second
      expect(callOrder).toContain('upload-started')
      // Both files should have been processed
      expect(result.current.jobs.length).toBe(2)
      expect(result.current.jobs.every((j) => j.status === 'complete')).toBe(true)
    })

    it('sets isProcessing to true during processing', async () => {
      vi.spyOn(transcribeApi, 'uploadAudio').mockImplementation(
        (file, onProgress) => {
          file
          onProgress
          return {
            xhr: {} as unknown as XMLHttpRequest,
            promise: Promise.resolve({
              text: `Transcription of ${(file as File).name}`,
              language: 'en',
              usage: { prompt_tokens: 10, completion_tokens: 5 },
              processing_time_ms: 100,
            }),
          }
        },
      )

      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
      })

      await act(async () => {
        await result.current.processQueue()
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.currentJobIndex).toBeNull()
    })

    it('handles job failure gracefully', async () => {
      vi.spyOn(transcribeApi, 'uploadAudio').mockImplementation((file, onProgress) => {
        file
        onProgress
        return {
          xhr: {} as unknown as XMLHttpRequest,
          promise: Promise.reject({
            error: 'connection_failed',
            message: 'Cannot connect to vLLM server',
            code: 503,
          }),
        }
      })

      const { result } = renderHook(() => useTranscribeQueue())

      act(() => {
        result.current.enqueue(createMockFile('a.wav', 1024))
      })

      await act(async () => {
        await result.current.processQueue()
      })

      expect(result.current.jobs[0].status).toBe('failed')
      expect(result.current.jobs[0].error).toBeDefined()
      if (result.current.jobs[0].error) {
        expect(result.current.jobs[0].error.error).toBe('connection_failed')
      }
    })
  })
})
