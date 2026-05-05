import { useState, useEffect, useCallback, useRef } from 'react'
import { type HealthResponse, type HealthErrorResponse, checkHealth } from '@/api/health'

interface HealthState {
  status: 'ok' | 'error' | null
  model: string | null
  latencyMs: number | null
  isChecking: boolean
  latencyHistory: number[]
  lastChecked: Date | null
  error: Error | null
}

const DEFAULT_POLLING_INTERVAL = 5000
const MAX_LATENCY_HISTORY = 10

export function useHealth(interval = DEFAULT_POLLING_INTERVAL) {
  const [state, setState] = useState<HealthState>({
    status: null,
    model: null,
    latencyMs: null,
    isChecking: false,
    latencyHistory: [],
    lastChecked: null,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<number | null>(null)

  const abortPending = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const performCheck = useCallback(async () => {
    abortPending()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setState((prev) => ({ ...prev, isChecking: true }))

    try {
      const data = await checkHealth(controller.signal)
      const latency =
        'latency_ms' in data ? (data as HealthResponse).latency_ms : null
      const status =
        'status' in data
          ? (data as HealthResponse | HealthErrorResponse).status
          : null

      setState((prev) => ({
        status,
        model: 'model' in data ? (data as HealthResponse).model : null,
        latencyMs: latency,
        isChecking: false,
        latencyHistory: latency !== null
          ? [...prev.latencyHistory, latency].slice(-MAX_LATENCY_HISTORY)
          : prev.latencyHistory,
        lastChecked: new Date(),
        error: null,
      }))
    } catch (err: unknown) {
      // Ignore abort errors
      if (controller.signal.aborted) return
      const error = err instanceof Error ? err : new Error(String(err))
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error,
      }))
    }
  }, [abortPending])

  // Set up polling
  useEffect(() => {
    // Initial check on mount
    performCheck()

    // Start polling
    intervalRef.current = window.setInterval(performCheck, interval)

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      abortPending()
    }
  }, [performCheck, interval, abortPending])

  const manualRefresh = useCallback(() => {
    performCheck()
  }, [performCheck])

  return {
    status: state.status,
    model: state.model,
    latencyMs: state.latencyMs,
    isChecking: state.isChecking,
    latencyHistory: state.latencyHistory,
    lastChecked: state.lastChecked,
    error: state.error,
    manualRefresh,
    pollingInterval: interval,
  }
}
