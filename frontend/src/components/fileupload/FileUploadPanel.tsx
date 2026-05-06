import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import FileUploadZone from './FileUploadZone'
import TranscribeQueue from './TranscribeQueue'
import ResultCard from './ResultCard'
import { useTranscribeQueue } from '@/hooks/useTranscribeQueue'
import { uploadAudio } from '@/api/transcribe'
import type { TranscribeJob } from '@/types/transcribe'

/**
 * Main panel for the File Upload tab.
 * Composes FileUploadZone, TranscribeQueue, and ResultCard
 * with the useTranscribeQueue hook for queue management.
 *
 * Per D-02: multi-file selection.
 * Per D-03: sequential processing.
 * Per D-10: user-friendly error messages for timeouts.
 */
export default function FileUploadPanel() {
  const {
    jobs,
    setJobs,
    isProcessing,
    enqueue,
    removeJob,
    processQueue,
    clearCompleted,
  } = useTranscribeQueue()

  const handleRetry = useCallback(
    (jobIndex: number) => {
      const job = jobs[jobIndex]
      if (!job || job.status !== 'failed') return
      // Re-enqueue the same file - will process next time processQueue runs
      const result = enqueue(job.file)
      if (result.success) {
        toast.success('Re-queued for transcription')
      } else {
        toast.error(result.reason)
      }
    },
    [jobs, enqueue],
  )

  const jobsRef = useRef(jobs)
  jobsRef.current = jobs

  const [comparingIndex, setComparingIndex] = useState<number | null>(null)

  const handleCompare = useCallback(
    async (jobIndex: number) => {
      const job = jobsRef.current[jobIndex]
      if (!job || job.status !== 'complete') return
      setComparingIndex(jobIndex)

      try {
        // Upload the same file again for cached result
        const result = await new Promise<NonNullable<TranscribeJob['result']>>(
          (resolve, reject) => {
            const { promise } = uploadAudio(job.file, undefined, undefined)
            promise.then(resolve).catch(reject)
          },
        )

        // Store comparison result on the job
        setJobs((prev) =>
          prev.map((j, i) =>
            i === jobIndex ? { ...j, comparison: result, isComparing: false } : j,
          ),
        )
        jobsRef.current = jobsRef.current.map((j, i) =>
          i === jobIndex ? { ...j, comparison: result, isComparing: false } : j,
        )
        toast.success('Comparison complete')
      } catch {
        toast.error('Comparison failed')
      } finally {
        setComparingIndex(null)
      }
    },
    [],
  )

  const handleFiles = useCallback(
    (files: File[]) => {
      let enqueued = 0
      for (const file of files) {
        const result = enqueue(file)
        if (result.success) {
          enqueued++
        } else {
          toast.error(result.reason)
        }
      }
      if (enqueued > 0) {
        toast.success(
          `Added ${enqueued} file${enqueued > 1 ? 's' : ''} to queue`,
        )
      }
    },
    [enqueue, processQueue],
  )

  // Split jobs into active and completed groups
  const activeJobs = jobs.filter(
    (job) => job.status !== 'complete' && job.status !== 'failed',
  )
  const completedJobs = jobs.filter(
    (job) => job.status === 'complete' || job.status === 'failed',
  )

  const hasQueuedOrProcessing = activeJobs.length > 0

  const handleQueueRemove = useCallback(
    (activeIndex: number) => {
      const job = activeJobs[activeIndex]
      const fullIndex = jobs.indexOf(job)
      if (fullIndex !== -1) removeJob(fullIndex)
    },
    [activeJobs, jobs, removeJob],
  )

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <section>
        <FileUploadZone onFiles={handleFiles} disabled={isProcessing} />
      </section>

      {/* Controls */}
      <section className="flex items-center gap-3">
        <button
          onClick={processQueue}
          disabled={isProcessing || !hasQueuedOrProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>Transcribe All</>
          )}
        </button>
        {completedJobs.length > 0 && (
          <button
            onClick={clearCompleted}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Clear Results
          </button>
        )}
      </section>

      {/* Active queue */}
      {activeJobs.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Queue
          </h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <TranscribeQueue jobs={activeJobs} isProcessing={isProcessing} onRemove={handleQueueRemove} />
          </div>
        </section>
      )}

      {/* Results */}
      {completedJobs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Results
          </h3>
          <div className="space-y-3">
            {completedJobs.map((job) => {
              // Find original index for remove callback
              const originalIndex = jobs.indexOf(job)
              return (
                <ResultCard
                  key={`${job.file.name}-${originalIndex}`}
                  job={job}
                  index={originalIndex}
                  onRemove={() => removeJob(originalIndex)}
                  onRetry={handleRetry}
                  onCompare={handleCompare}
                  comparison={
                    job.comparison
                      ? {
                          result: job.comparison,
                          latencyMs: job.comparison.processing_time_ms,
                        }
                      : null
                  }
                  isComparing={comparingIndex === originalIndex}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
