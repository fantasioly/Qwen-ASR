import { useCallback } from 'react'
import { toast } from 'sonner'
import FileUploadZone from './FileUploadZone'
import TranscribeQueue from './TranscribeQueue'
import ResultCard from './ResultCard'
import { useTranscribeQueue } from '@/hooks/useTranscribeQueue'

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
    isProcessing,
    enqueue,
    processQueue,
    clearCompleted,
  } = useTranscribeQueue()

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
        processQueue()
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
            <TranscribeQueue jobs={activeJobs} isProcessing={isProcessing} />
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
                  onRemove={() => {
                    // Removed via clearCompleted button
                  }}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
