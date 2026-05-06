import { Loader2 } from 'lucide-react'
import { type TranscribeJob } from '@/types/transcribe'

interface TranscribeQueueProps {
  jobs: TranscribeJob[]
  isProcessing: boolean
}

const STATUS_LABELS = {
  queued: 'Waiting...',
  uploading: 'Uploading...',
  processing: 'Processing...',
  complete: 'Complete',
}

export default function TranscribeQueue({
  jobs,
}: TranscribeQueueProps) {
  if (jobs.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No files in queue</p>
  }

  return (
    <div className="space-y-1 py-2">
      {jobs.map((job, index) => {
        const barColor =
          job.status === 'complete'
            ? 'bg-green-500'
            : job.status === 'failed'
              ? 'bg-red-500'
              : 'bg-blue-500'

        const labelColor =
          job.status === 'queued'
            ? 'text-gray-400'
            : job.status === 'uploading'
              ? 'text-blue-500'
              : job.status === 'processing'
                ? 'text-yellow-500'
                : job.status === 'complete'
                  ? 'text-green-600'
                  : 'text-red-500'

        const statusText =
          job.status === 'failed'
            ? job.error?.message ?? 'Error'
            : STATUS_LABELS[job.status]

        return (
          <div
            key={index}
            className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            {/* Filename + size — truncated */}
            <span className="truncate max-w-xs text-sm text-gray-800 flex-shrink-0">
              {job.file.name} ({(job.file.size / 1024).toFixed(0)}KB)
            </span>

            {/* Progress bar */}
            <div className="flex-1 bg-gray-200 rounded-full overflow-hidden h-1">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${job.progress}%` }}
              />
            </div>

            {/* Status label */}
            <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${labelColor}`}>
              {job.status === 'processing' && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {job.status === 'complete' && <span className="text-green-600 text-sm">✓</span>}
              <span className="whitespace-nowrap">{statusText}</span>
              {(job.status === 'uploading' || job.status === 'processing') && (
                <span className="text-gray-400 ml-0.5">
                  {job.progress}%
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
