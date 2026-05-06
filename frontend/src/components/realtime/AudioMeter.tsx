import { cn } from '@/lib/utils'

interface AudioMeterProps {
  audioLevel: number // 0-1
  isActive: boolean
}

const SEGMENT_THRESHOLDS = [0.25, 0.5, 0.75] as const

function getSegmentColor(level: number, index: number): string {
  if (index < 3) return 'bg-emerald-500'
  if (level <= 0.3) return 'bg-emerald-500'
  if (level <= 0.7) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function AudioMeter({ audioLevel, isActive }: AudioMeterProps) {
  const isPulsing = isActive && audioLevel > 0.1

  return (
    <div className="flex items-center gap-1.5">
      {SEGMENT_THRESHOLDS.map((threshold, index) => {
        const filled = isActive && audioLevel > threshold
        const color = filled
          ? getSegmentColor(audioLevel, index)
          : 'bg-gray-200'

        return (
          <div
            key={threshold}
            className={cn(
              'h-2 w-8 rounded-full transition-colors duration-100',
              color,
              isPulsing && filled && 'animate-pulse',
            )}
          />
        )
      })}
      {/* Peak segment (always visible when active and level > 0) */}
      <div
        className={cn(
          'h-2 w-8 rounded-full transition-colors duration-100',
          isActive && audioLevel > 0
            ? getSegmentColor(audioLevel, 3)
            : 'bg-gray-200',
          isPulsing && 'animate-pulse',
        )}
      />
    </div>
  )
}
