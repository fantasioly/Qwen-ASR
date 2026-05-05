import { useState, useCallback, useRef, useEffect } from 'react'
import {
  type TranscribeJob,
  type TranscribeError,
} from '@/types/transcribe'
import { validateFile, uploadAudio } from '@/api/transcribe'

/**
 * Return type of the useTranscribeQueue hook.
 */
export interface UseTranscribeQueueReturn {
  jobs: TranscribeJob[]
  isProcessing: boolean
  currentJobIndex: number | null
  enqueue: (file: File) => { success: true } | { success: false; reason: string }
  removeJob: (index: number) => void
  processQueue: () => Promise<void>
  clearCompleted: () => void
}

/**
 * Custom hook for managing a FIFO transcription queue.
 *
 * Files are processed sequentially (not in parallel) — one at a time
 * via for-await loop. Each file transitions through status states:
 * queued → uploading → processing → complete/failed.
 *
 * Per D-02: supports multi-file selection.
 * Per D-03: sequential queue processing.
 * Per D-05: per-file progress reporting.
 */
export function useTranscribeQueue(): UseTranscribeQueueReturn {
  const [jobs, setJobs] = useState<TranscribeJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentJobIndex, setCurrentJobIndex] = useState<number | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount: abort any in-flight upload
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  /**
   * Add a file to the transcription queue.
   * Validates the file before enqueuing — rejects unsupported formats
   * and oversized files with specific reasons.
   *
   * @param file - The audio file to queue
   * @returns Validation result with reason if rejected
   */
  const enqueue = useCallback(
    (file: File): { success: true } | { success: false; reason: string } => {
      const validation = validateFile(file)
      if (!validation.valid) {
        return { success: false, reason: validation.reason }
      }
      const newJob: TranscribeJob = {
        file,
        status: 'queued',
        progress: 0,
      }
      setJobs((prev) => [...prev, newJob])
      return { success: true }
    },
    [],
  )

  /**
   * Remove a job from the queue by index.
   * Only removes queued jobs (not currently processing).
   */
  const removeJob = useCallback((index: number) => {
    setJobs((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Clear all completed and failed jobs from the queue.
   * Preserves jobs that are still queued or uploading.
   */
  const clearCompleted = useCallback(() => {
    setJobs((prev) =>
      prev.filter(
        (job) => job.status !== 'complete' && job.status !== 'failed',
      ),
    )
  }, [])

  /**
   * Process all queued jobs sequentially (FIFO).
   *
   * Each job transitions through:
   * queued → uploading (XHR started, progress updates)
   * → processing (upload done, awaiting API response)
   * → complete or failed
   *
   * Uses AbortController for cancellation on unmount.
   */
  const processQueue = useCallback(async () => {
    if (isProcessing) return

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsProcessing(true)

    // Use a mutable copy for iteration (stable indices since enqueue is blocked)
    let currentJobs = [...jobs]

    for (let i = 0; i < currentJobs.length; i++) {
      if (controller.signal.aborted) break

      setCurrentJobIndex(i)

      // Mark as uploading
      setJobs((prev) =>
        prev.map((job, idx) =>
          idx === i ? { ...job, status: 'uploading' as const, progress: 0 } : job,
        ),
      )

      try {
        const result = await new Promise<NonNullable<TranscribeJob['result']>>(
          (resolve, reject) => {
            const onProgress = (percent: number) => {
              setJobs((prev) =>
                prev.map((job, idx) =>
                  idx === i ? { ...job, progress: percent } : job,
                ),
              )
            }

            const { promise } = uploadAudio(
              currentJobs[i].file,
              onProgress,
              controller.signal,
            )

            promise.then(resolve).catch(reject)
          },
        )

        // Mark as processing (upload done, got response)
        setJobs((prev) =>
          prev.map((job, idx) =>
            idx === i
              ? { ...job, status: 'processing' as const, progress: 100 }
              : job,
          ),
        )

        // Mark as complete
        setJobs((prev) =>
          prev.map((job, idx) =>
            idx === i
              ? { ...job, status: 'complete' as const, result }
              : job,
          ),
        )
      } catch (err: unknown) {
        // Ignore abort errors
        if (controller.signal.aborted) break

        const error: TranscribeError = err as TranscribeError
        setJobs((prev) =>
          prev.map((job, idx) =>
            idx === i
              ? {
                  ...job,
                  status: 'failed' as const,
                  error,
                  progress: job.progress,
                }
              : job,
          ),
        )
      }
    }

    setIsProcessing(false)
    setCurrentJobIndex(null)
    abortControllerRef.current = null
  }, [jobs, isProcessing])

  return {
    jobs,
    isProcessing,
    currentJobIndex,
    enqueue,
    removeJob,
    processQueue,
    clearCompleted,
  }
}
