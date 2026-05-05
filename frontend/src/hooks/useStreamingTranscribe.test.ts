import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStreamingTranscribe } from '@/hooks/useStreamingTranscribe'
import { setWebSocketFactory } from '@/api/streaming'

// Mock WebSocket factory
function createMockWs(): {
  instance: WebSocket
  mock: {
    send: ReturnType<typeof vi.fn>
    triggerOnopen: () => void
    triggerOnmessage: (data: string) => void
    triggerOnclose: () => void
  }
} {
  const mockSend = vi.fn()
  const mock = {
    send: mockSend,
    triggerOnopen: () => {
      if (instance.onopen) instance.onopen({} as Event)
    },
    triggerOnmessage: (data: string) => {
      if (instance.onmessage)
        instance.onmessage({ data } as MessageEvent)
    },
    triggerOnclose: () => {
      if (instance.onclose)
        instance.onclose({ code: 1006 } as CloseEvent)
    },
  }

  const instance = {
    url: '',
    readyState: 0,
    onopen: null as ((ev: Event) => void) | null,
    onmessage: null as ((ev: MessageEvent) => void) | null,
    onclose: null as ((ev: CloseEvent) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
    send: mockSend,
    close: vi.fn(),
  } as unknown as WebSocket

  return { instance, mock }
}

describe('useStreamingTranscribe', () => {
  let mockWs: ReturnType<typeof createMockWs>

  beforeEach(() => {
    vi.useFakeTimers()
    mockWs = createMockWs()
    setWebSocketFactory(vi.fn().mockReturnValue(mockWs.instance) as unknown as (url: string) => WebSocket)

    // Mock navigator.mediaDevices.getUserMedia
    vi.stubGlobal(
      'navigator',
      Object.assign(navigator, {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
            stop: vi.fn(),
          }),
        },
      }),
    )

    // Mock AudioContext
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      connect: vi.fn(),
      getByteFrequencyData: vi.fn((arr: Uint8Array) => {
        arr.fill(128)
      }),
    }
    const mockScriptProcessor = {
      onaudioprocess: null as ((ev: any) => void) | null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }

    class MockAudioContext {
      sampleRate = 16000
      destination = {}
      constructor() {
        // Accept optional config but ignore it for testing
      }
      createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }))
      createAnalyser = vi.fn(() => mockAnalyser)
      createScriptProcessor = vi.fn(() => mockScriptProcessor)
      close = vi.fn()
    }

    vi.stubGlobal('AudioContext', MockAudioContext)
  })

  afterEach(() => {
    setWebSocketFactory(null)
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('starts in disconnected state with no active recording', async () => {
    const { result } = renderHook(() => useStreamingTranscribe())

    expect(result.current.isRecording).toBe(false)
    expect(result.current.wsState).toBeDefined()
    expect(result.current.partialText).toBe('')
    expect(result.current.finalText).toBe('')
    expect(result.current.finalUsage).toBeNull()
    expect(result.current.detectedLanguage).toBe('unknown')
    expect(result.current.elapsedSeconds).toBe(0)
    expect(result.current.audioLevel).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('startRecording requests microphone and returns promise', async () => {
    const { result } = renderHook(() => useStreamingTranscribe())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.isRecording).toBe(true)
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('stopRecording stops recording and resets state', async () => {
    const { result } = renderHook(() => useStreamingTranscribe())

    await act(async () => {
      await result.current.startRecording()
    })
    expect(result.current.isRecording).toBe(true)

    act(() => {
      result.current.stopRecording()
    })

    expect(result.current.isRecording).toBe(false)
  })

  it('tracks elapsed seconds during recording', async () => {
    const { result } = renderHook(() => useStreamingTranscribe())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.elapsedSeconds).toBe(0)

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.elapsedSeconds).toBe(3)
  })
})
