import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import HealthStatus from './HealthStatus'
import LatencyChart from './LatencyChart'
import { useHealth } from '@/hooks/useHealth'

interface HealthCheckAPIError extends Error {
  error: string
}

interface ErrorMessageMap {
  [key: string]: string
}

const ERROR_MESSAGES: ErrorMessageMap = {
  timeout: 'API request timed out. Check connectivity and try again.',
  connection_failed:
    'Cannot reach vLLM server. Check API URL and network settings.',
  internal_error: 'Server error. Try refreshing or check Settings.',
}

export default function ConnectionTestPanel() {
  const {
    status,
    model,
    latencyMs,
    isChecking,
    latencyHistory,
    lastChecked,
    error,
    manualRefresh,
  } = useHealth()

  // Determine display status
  const displayStatus = isChecking
    ? 'checking'
    : error
      ? 'error'
      : status === 'ok'
        ? 'ok'
        : 'error'

  // Build error message for display
  const errorMessage = (() => {
    if (!error) return undefined
    const apiError = error as HealthCheckAPIError
    return (
      ERROR_MESSAGES[apiError.error] ??
      error.message ??
      'An unexpected error occurred.'
    )
  })()

  // Show toast for persistent errors (D-16)
  if (error && !isChecking) {
    toast.error(errorMessage ?? 'Health check failed', {
      id: `health-error-${Date.now()}`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Status indicator section */}
      <section className="mb-6">
        <HealthStatus status={displayStatus} message={errorMessage} />
      </section>

      {/* Model info, latency, and controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Model info */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Model
          </h3>
          {status === 'ok' ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-lg font-mono text-gray-900 break-all">
                {model ?? 'Unknown'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-400 italic">
                Not available
              </p>
            </div>
          )}
        </section>

        {/* Latency */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Latency
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {latencyMs !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {latencyMs.toFixed(0)}
                </span>
                <span className="text-sm text-gray-500">ms</span>
              </div>
            ) : (
              <p className="text-gray-400 italic">No data</p>
            )}
            <LatencyChart data={latencyHistory} />
          </div>
        </section>
      </div>

      {/* Controls */}
      <section className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-400">
          {lastChecked ? (
            <span>
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          ) : (
            <span>Not yet checked</span>
          )}
        </div>
        <button
          onClick={manualRefresh}
          disabled={isChecking}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Refresh Now"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isChecking ? 'Checking...' : 'Refresh Now'}
        </button>
      </section>
    </div>
  )
}
