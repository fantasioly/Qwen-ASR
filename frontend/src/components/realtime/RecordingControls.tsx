import { Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecordingControlsProps {
  isRecording: boolean
  wsState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  elapsedSeconds: number
  onStart: () => void
  onStop: () => void
}

const STATUS_CONFIG = {
  disconnected: {
    dot: 'bg-red-500',
    label: 'Disconnected',
  },
  connecting: {
    dot: 'bg-yellow-500 animate-pulse',
    label: 'Connecting...',
  },
  connected: {
    dot: 'bg-emerald-500',
    label: 'Connected',
  },
  reconnecting: {
    dot: 'bg-yellow-500 animate-ping',
    label: 'Reconnecting...',
  },
} as const

export default function RecordingControls({
  isRecording,
  wsState,
  elapsedSeconds,
  onStart,
  onStop,
}: RecordingControlsProps) {
  const isDisconnected = wsState === 'disconnected'
  const status = STATUS_CONFIG[wsState]

  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (elapsedSeconds % 60).toString().padStart(2, '0')

  return (
    <div className="flex items-center gap-4">
      {/* Status dot + label */}
      <div className="flex items-center gap-2">
        <span className={cn('w-3 h-3 rounded-full', status.dot)} />
        <span className="text-xs text-gray-500">{status.label}</span>
      </div>

      {/* Timer */}
      <span className="text-sm font-mono text-gray-600 tabular-nums">
        {minutes}:{seconds}
      </span>

      {/* Toggle record button */}
      <button
        onClick={isRecording ? onStop : onStart}
        disabled={isDisconnected && !isRecording}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          isRecording
            ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
            : isDisconnected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
        )}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  )
}
