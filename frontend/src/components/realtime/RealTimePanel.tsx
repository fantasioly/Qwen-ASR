import { useCallback } from 'react'
import { Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { useStreamingTranscribe } from '@/hooks/useStreamingTranscribe'
import RecordingControls from './RecordingControls'
import StreamingText from './StreamingText'
import AudioMeter from './AudioMeter'

export default function RealTimePanel() {
  const {
    isRecording,
    wsState,
    partialText,
    finalText,
    finalUsage,
    partialUsage,
    detectedLanguage,
    elapsedSeconds,
    audioLevel,
    startRecording,
    stopRecording,
    error,
  } = useStreamingTranscribe()

  const displayUsage = finalUsage ?? partialUsage

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(finalText).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy'),
    )
  }, [finalText])

  return (
    <div className="space-y-6">
      {/* Error banner for connection failure */}
      {error && !isRecording && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Controls top: recording controls + audio meter */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <RecordingControls
          isRecording={isRecording}
          wsState={wsState}
          elapsedSeconds={elapsedSeconds}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <AudioMeter audioLevel={audioLevel} isActive={isRecording} />
      </div>

      {/* Results below */}
      {finalText ? (
        /* Final result card matches File Upload ResultCard pattern */
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">
                Stream Result
              </h4>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {detectedLanguage}
              </span>
              {displayUsage && (
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    displayUsage.cache_read_tokens > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {displayUsage.cache_read_tokens > 0
                    ? `\u{1F7E2} ${finalUsage.cache_read_tokens} cached`
                    : '\u2014'}
                </span>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Copy transcription text"
              title="Copy to clipboard"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed mb-3">
            {finalText}
          </div>
          {displayUsage && (
            <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Prompt: {displayUsage.prompt_tokens} tokens
              </span>
              <span className="text-xs text-gray-500">
                Completion: {displayUsage.completion_tokens} tokens
              </span>
              <span className="text-xs text-gray-500">
                Cached: {displayUsage.cache_read_tokens} tokens
              </span>
            </div>
          )}
        </div>
      ) : isRecording ? (
        /* Streaming text with live language badge */
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            {detectedLanguage && detectedLanguage !== 'unknown' && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {detectedLanguage}
              </span>
            )}
          </div>
          <StreamingText text={partialText} isStreaming={isRecording} />
        </div>
      ) : (
        /* Empty state */
        <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400">
            Click "Start Recording" to begin real-time transcription
          </p>
        </div>
      )}
    </div>
  )
}
