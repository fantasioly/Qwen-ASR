interface LatencyChartProps {
  data: number[]
}

export default function LatencyChart({ data }: LatencyChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
    )
  }

  const maxVal = Math.max(...data, 100)

  const getBarColor = (val: number): string => {
    if (val < 100) return 'bg-emerald-500'
    if (val <= 500) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-end gap-1 h-16" role="img" aria-label="Latency history sparkline">
      {data.map((val, i) => {
        const height = Math.max((val / maxVal) * 100, 8)
        return (
          <div
            key={i}
            className="flex-1 min-w-[4px] rounded-t transition-all duration-200 hover:opacity-80 cursor-default"
            style={{ height: `${height}%` }}
            title={`${val} ms`}
            role="presentation"
          >
            <div
              className={cn(
                'w-full h-full rounded-t',
                getBarColor(val),
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
