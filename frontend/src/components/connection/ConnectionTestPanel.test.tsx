import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConnectionTestPanel from '@/components/connection/ConnectionTestPanel'

// Mock useHealth hook
vi.mock('@/hooks/useHealth', () => ({
  useHealth: vi.fn(),
}))
import { useHealth } from '@/hooks/useHealth'
const mockedUseHealth = vi.mocked(useHealth)

describe('ConnectionTestPanel', () => {
  it('shows model name from health response', () => {
    mockedUseHealth.mockReturnValue({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latencyMs: 123,
      isChecking: false,
      latencyHistory: [100, 123],
      lastChecked: new Date(),
      error: null,
      manualRefresh: vi.fn(),
      pollingInterval: 5000,
    })

    render(<ConnectionTestPanel />)
    expect(screen.getByText(/Qwen3-ASR-1.7B/i)).toBeInTheDocument()
  })

  it('shows latency in ms', () => {
    mockedUseHealth.mockReturnValue({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latencyMs: 123,
      isChecking: false,
      latencyHistory: [100, 123],
      lastChecked: new Date(),
      error: null,
      manualRefresh: vi.fn(),
      pollingInterval: 5000,
    })

    render(<ConnectionTestPanel />)
    // Latency is displayed as "123" + "ms" across adjacent spans
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.getByText('ms')).toBeInTheDocument()
  })

  it('shows manual refresh button', () => {
    mockedUseHealth.mockReturnValue({
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latencyMs: 123,
      isChecking: false,
      latencyHistory: [100, 123],
      lastChecked: new Date(),
      error: null,
      manualRefresh: vi.fn(),
      pollingInterval: 5000,
    })

    render(<ConnectionTestPanel />)
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('shows actionable error message for timeout', () => {
    mockedUseHealth.mockReturnValue({
      status: null,
      model: null,
      latencyMs: null,
      isChecking: false,
      latencyHistory: [],
      lastChecked: null,
      error: Object.assign(new Error('timeout'), { error: 'timeout' }),
      manualRefresh: vi.fn(),
      pollingInterval: 5000,
    })

    render(<ConnectionTestPanel />)
    expect(screen.getByText(/timed out/i)).toBeInTheDocument()
  })

  it('shows actionable error message for connection_failed', () => {
    mockedUseHealth.mockReturnValue({
      status: 'error',
      model: null,
      latencyMs: null,
      isChecking: false,
      latencyHistory: [],
      lastChecked: null,
      error: Object.assign(new Error('Connection failed'), { error: 'connection_failed' }),
      manualRefresh: vi.fn(),
      pollingInterval: 5000,
    })

    render(<ConnectionTestPanel />)
    expect(screen.getByText(/cannot reach|vllm/i)).toBeInTheDocument()
  })
})
