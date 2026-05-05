import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkHealth } from '@/api/health'

describe('checkHealth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns typed data with status, model, latency_ms on success', async () => {
    const mockResponse = {
      status: 'ok',
      model: 'Qwen3-ASR-1.7B',
      latency_ms: 123.45,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response))

    const result = await checkHealth()
    expect(result).toEqual(mockResponse)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.model).toBe('Qwen3-ASR-1.7B')
      expect(result.latency_ms).toBe(123.45)
    }
  })

  it('returns error data from backend on non-200 status', async () => {
    const mockError = {
      detail: {
        error: 'timeout',
        message: 'API request timed out after 10s',
        code: 504,
      },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 504,
      json: () => Promise.resolve(mockError),
    } as Response))

    await expect(checkHealth()).rejects.toThrow(
      'API request timed out after 10s',
    )
  })

  it('throws structured error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(
      new Error('Failed to fetch'),
    ))

    await expect(checkHealth()).rejects.toThrow('Failed to fetch')
  })
})
