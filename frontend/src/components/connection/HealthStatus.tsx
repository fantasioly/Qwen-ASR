import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HealthStatusProps {
  status: 'ok' | 'error' | 'checking'
  message?: string
}

export default function HealthStatus({ status, message }: HealthStatusProps) {
  const config = {
    ok: {
      label: 'Connected',
      icon: (
        <CheckCircle2 className="w-12 h-12 text-emerald-500 transition-all duration-200" />
      ),
      dot: 'bg-emerald-500',
    },
    error: {
      label: 'Disconnected',
      icon: (
        <XCircle className="w-12 h-12 text-red-500 transition-all duration-200" />
      ),
      dot: 'bg-red-500',
    },
    checking: {
      label: 'Checking...',
      icon: (
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin transition-all duration-200" />
      ),
      dot: 'bg-yellow-500',
    },
  }[status]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-2">
        {config.icon}
        <span
          className={cn(
            'inline-flex items-center gap-2 text-lg font-semibold',
            status === 'ok' && 'text-emerald-700',
            status === 'error' && 'text-red-700',
            status === 'checking' && 'text-yellow-600',
          )}
        >
          <span
            className={cn(
              'w-3 h-3 rounded-full',
              config.dot,
              status === 'checking' && 'animate-ping',
            )}
          />
          {config.label}
        </span>
      </div>
      {status === 'error' && message && (
        <p className="text-sm text-red-600 mt-1 text-center max-w-sm">
          {message}
        </p>
      )}
    </div>
  )
}
