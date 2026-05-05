import { useCallback } from 'react'
import { Clipboard, X } from 'lucide-react'
import { toast } from 'sonner'
import { type TranscribeJob } from '@/types/transcribe'

interface ResultCardProps {
  job: TranscribeJob
  onRemove?: (index: number) => void
  index?: number
}

export default function ResultCard({
  job,
  onRemove,
  index,
}: ResultCardProps) {
  const handleCopy = useCallback(() => {
    const text = job.result?.text ?? ''
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Copied to clipboard')
      },
      () => {
        toast.error('Failed to copy to clipboard')
      },
    )
  }, [job.result])

  const handleRemove = useCallback(() => {
    if (onRemove && index !== undefined) {
      onRemove(index)
    }
  }, [onRemove, index])

  if (job.status === 'failed') {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-red-800">{job.file.name}</h4>
          {onRemove && (
            <button
              onClick={handleRemove}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Remove result"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-red-600">
          {job.error?.message ?? 'Transcription failed'}
        </p>
      </div>
    )
  }

  const text = job.result?.text ?? ''
  const hasSpeech = text.trim().length > 0

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate flex-shrink-0 mr-2">
            {job.file.name}
          </h4>
          {job.result?.language && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
              {job.result.language}
            </span>
          )}
          {job.result?.processing_time_ms !== undefined && (
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
              {Math.round(job.result.processing_time_ms / 1000)}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Copy transcription text"
            title="Copy to clipboard"
          >
            <Clipboard className="w-4 h-4" />
          </button>
          {onRemove && (
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Remove result"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body: transcription text */}
      <div className="mb-3">
        {hasSpeech ? (
          <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {text}
          </div>
        ) : (
          <p className="text-gray-400 italic">No speech detected</p>
        )}
      </div>

      {/* Stats row */}
      {job.result && (
        <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Prompt: {job.result.usage?.prompt_tokens ?? 0} tokens
          </span>
          <span className="text-xs text-gray-500">
            Completion: {job.result.usage?.completion_tokens ?? 0} tokens
          </span>
          <span className="text-xs text-gray-500">
            Time: {(job.result.processing_time_ms ?? 0).toFixed(0)}ms
          </span>
        </div>
      )}
    </div>
  )
}
