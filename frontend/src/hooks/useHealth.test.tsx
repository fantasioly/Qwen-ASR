import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHealth } from '@/hooks/useHealth'

// Mock the API module
const mockCheckHealth = vi.fn()
vi.mock('@/api/health', () => ({
  checkHealth: () => mockCheckHealth(),
}))

describe('useHealth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockCheckHealth.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with polling on mount at 5s interval', async () => {
    mockCheckHealth.mockResolvedValue({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latency_ms: 50,
    })

    renderHook(() => useHealth())

    // Initial call
    expect(mockCheckHealth).toHaveBeenCalledTimes(1)

    // Poll after 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(mockCheckHealth).toHaveBeenCalledTimes(2)
  })

  it('manualRefresh triggers immediate health check', async () => {
    mockCheckHealth.mockResolvedValue({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latency_ms: 50,
    })

    const { result } = renderHook(() => useHealth())

    // Wait for initial call to settle
    await act(async () => {
      await Promise.resolve()
    })
    expect(mockCheckHealth).toHaveBeenCalledTimes(1)

    // Manual refresh
    await act(async () => {
      result.current.manualRefresh()
      await Promise.resolve()
    })
    expect(mockCheckHealth).toHaveBeenCalledTimes(2)
  })

  it('aborts pending poll on unmount', async () => {
    mockCheckHealth.mockResolvedValue({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latency_ms: 50,
    })

    const { unmount } = renderHook(() => useHealth())

    unmount()

    // Advance time past the polling interval
    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    // Only the initial call should have been made; no poll after unmount
    expect(mockCheckHealth).toHaveBeenCalledTimes(1)
  })

  it('maintains latencyHistory array (last 10 readings)', async () => {
    // Simulate 12 successful health checks
    for (let i = 1; i <= 12; i++) {
      mockCheckHealth.mockResolvedValueOnce({
        status: 'ok',
        model: 'Qwen3-ASR-1.7B',
        latency_ms: i * 10,
      })
    }

    const { result } = renderHook(() => useHealth())

    // Initial call
    await act(async () => {
      await Promise.resolve()
    })

    // Trigger 11 more calls via polling
    for (let i = 0; i < 11; i++) {
      await act(async () => {
        vi.advanceTimersByTime(5000)
        await Promise.resolve()
      })
    }

    expect(result.current.latencyHistory).toHaveLength(10)
    // 12 calls total: latency = 10,20,...,120. Last 10 = 30,40,...,120
    expect(result.current.latencyHistory[0]).toBe(30) // third call
    expect(result.current.latencyHistory[9]).toBe(120) // twelfth call
  })

  it('sets error state on failure', async () => {
    mockCheckHealth.mockResolvedValueOnce({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latency_ms: 50,
    }).mockRejectedValueOnce(new Error('Connection failed'))

    const { result } = renderHook(() => useHealth())

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.error).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(result.current.error?.message).toBe('Connection failed')
  })

  it('clears error on subsequent success', async () => {
    mockCheckHealth.mockResolvedValueOnce({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latency_ms: 50,
    })
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockResolvedValueOnce({
        status: 'ok',
        model: 'Qwen3-ASR-1.7B',
        latency_ms: 60,
      })

    const { result } = renderHook(() => useHealth())

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.error).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(result.current.error?.message).toBe('Connection failed')

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(result.current.error).toBeNull()
  })
})
