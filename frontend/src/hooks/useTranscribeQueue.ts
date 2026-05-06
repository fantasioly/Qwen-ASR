import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  type TranscribeJob,
  type TranscribeError,
} from '@/types/transcribe'
import { validateFile, uploadAudio } from '@/api/transcribe'

export interface UseTranscribeQueueReturn {
  jobs: TranscribeJob[]
  setJobs: React.Dispatch<React.SetStateAction<TranscribeJob[]>>
  isProcessing: boolean
  enqueue: (file: File) => { success: true } | { success: false; reason: string }
  removeJob: (index: number) => void
  processQueue: () => Promise<void>
  clearCompleted: () => void
}

export function useTranscribeQueue(): UseTranscribeQueueReturn {
  const [jobs, setJobs] = useState<TranscribeJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const processingRef = useRef(false)
  const jobsRef = useRef<TranscribeJob[]>([])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

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
      jobsRef.current = [...jobsRef.current, newJob]
      setJobs([...jobsRef.current])
      return { success: true }
    },
    [],
  )

  const removeJob = useCallback((index: number) => {
    jobsRef.current = jobsRef.current.filter((_, i) => i !== index)
    setJobs([...jobsRef.current])
  }, [])

  const clearCompleted = useCallback(() => {
    jobsRef.current = jobsRef.current.filter(
      (job) => job.status !== 'complete' && job.status !== 'failed',
    )
    setJobs([...jobsRef.current])
  }, [])

  /**
   * Update both ref and state atomically for a single file.
   */
  const updateJob = (
    file: File,
    updater: (job: TranscribeJob) => TranscribeJob,
  ) => {
    jobsRef.current = jobsRef.current.map((j) =>
      j.file === file ? updater(j) : j,
    )
    setJobs([...jobsRef.current])
  }

  const processQueue = useCallback(async () => {
    if (processingRef.current) return

    const controller = new AbortController()
    abortControllerRef.current = controller
    processingRef.current = true
    setIsProcessing(true)

    const pendingFiles = jobsRef.current
      .filter((j) => j.status !== 'complete' && j.status !== 'failed')
      .map((j) => j.file)

    for (const file of pendingFiles) {
      if (controller.signal.aborted) break

      updateJob(file, (j) => ({ ...j, status: 'uploading' as const, progress: 0 }))

      try {
        const result = await new Promise<NonNullable<TranscribeJob['result']>>(
          (resolve, reject) => {
            const onProgress = (percent: number) => {
              updateJob(file, (j) => ({ ...j, progress: percent }))
            }

            const { promise } = uploadAudio(file, onProgress, controller.signal)
            promise.then(resolve).catch(reject)
          },
        )

        updateJob(file, (j) => ({
          ...j,
          status: 'complete' as const,
          progress: 100,
          result,
        }))
      } catch (err: unknown) {
        if (controller.signal.aborted) break

        const error: TranscribeError = err as TranscribeError
        updateJob(file, (j) => ({
          ...j,
          status: 'failed' as const,
          error,
          progress: j.progress,
        }))
      }
    }

    processingRef.current = false
    setIsProcessing(false)
    abortControllerRef.current = null
  }, [])

  return {
    jobs,
    setJobs,
    isProcessing,
    enqueue,
    removeJob,
    processQueue,
    clearCompleted,
  }
}
