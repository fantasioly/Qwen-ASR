import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StreamingClient, setWebSocketFactory, type StreamingState } from '@/api/streaming'

// READY_STATE constants (from WebSocket spec, not available in jsdom)
const CONNECTING = 0
const OPEN = 1
const CLOSING = 2
const CLOSED = 3

/**
 * Helper: create a mock WebSocket instance and factory for testing.
 */
function createMockWebSocket(): {
  instance: WebSocket
  mock: {
    send: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    triggerOnopen: () => void
    triggerOnmessage: (data: string) => void
    triggerOnclose: (code?: number) => void
    triggerOnerror: () => void
  }
} {
  const mockSend = vi.fn()
  const mockClose = vi.fn()

  const mock = {
    send: mockSend,
    close: mockClose,
    triggerOnopen: () => {
      if (instance.onopen) instance.onopen({} as Event)
    },
    triggerOnmessage: (data: string) => {
      if (instance.onmessage)
        instance.onmessage({ data } as MessageEvent)
    },
    triggerOnclose: (code = 1000) => {
      if (instance.onclose)
        instance.onclose({ code } as CloseEvent)
    },
    triggerOnerror: () => {
      if (instance.onerror) instance.onerror({} as Event)
    },
  }

  const instance = {
    url: '',
    readyState: CONNECTING,
    onopen: null as ((ev: Event) => void) | null,
    onmessage: null as ((ev: MessageEvent) => void) | null,
    onclose: null as ((ev: CloseEvent) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
    send: mockSend,
    close: mockClose,
  } as unknown as WebSocket

  return { instance, mock }
}

describe('StreamingClient', () => {
  let mockWsFactory: ReturnType<typeof vi.fn>
  let mockWs: ReturnType<typeof createMockWebSocket>
  let stateChanges: StreamingState[]
  let partialTexts: string[]
  let finalResults: Array<{ text: string; usage?: { prompt_tokens: number; completion_tokens: number } }>
  let errors: string[]

  beforeEach(() => {
    vi.useFakeTimers()
    stateChanges = []
    partialTexts = []
    finalResults = []
    errors = []

    mockWs = createMockWebSocket()
    mockWsFactory = vi.fn().mockReturnValue(mockWs.instance)

    // Inject the mock WebSocket factory
    setWebSocketFactory(mockWsFactory as unknown as (url: string) => WebSocket)
  })

  afterEach(() => {
    setWebSocketFactory(null)
    vi.useRealTimers()
  })

  function createClient(): StreamingClient {
    return new StreamingClient(
      (state) => stateChanges.push(state),
      (text) => partialTexts.push(text),
      (text, usage) => finalResults.push({ text, usage }),
      (msg) => errors.push(msg),
    )
  }

  it('connects to /ws/transcribe and emits connecting state', () => {
    const client = createClient()
    client.connect()

    expect(mockWsFactory).toHaveBeenCalledWith('/ws/transcribe')
    expect(stateChanges).toContain('connecting')
  })

  it('emits connected state on successful connection', () => {
    const client = createClient()
    client.connect()

    mockWs.mock.triggerOnopen()

    expect(stateChanges).toContain('connected')
  })

  it('sends audio frame when sendAudio is called', () => {
    const client = createClient()
    client.connect()
    mockWs.mock.triggerOnopen()

    const base64Data = 'SGVsbG8gV29ybGQ='
    client.sendAudio(base64Data)

    const sent = JSON.parse(mockWs.mock.send.mock.calls[0][0] as string)
    expect(sent).toEqual({ type: 'audio', data: base64Data })
  })

  it('sends start frame when start is called', () => {
    const client = createClient()
    client.connect()
    mockWs.mock.triggerOnopen()

    client.start()

    const sent = JSON.parse(mockWs.mock.send.mock.calls[0][0] as string)
    expect(sent).toEqual({ type: 'start' })
  })

  it('sends stop frame when stop is called', () => {
    const client = createClient()
    client.connect()
    mockWs.mock.triggerOnopen()

    client.stop()

    const sent = JSON.parse(mockWs.mock.send.mock.calls[0][0] as string)
    expect(sent).toEqual({ type: 'stop' })
  })

  it('does not send messages when not connected', () => {
    const client = createClient()
    client.connect()
    // Don't trigger onopen

    client.sendAudio('test')
    client.start()
    client.stop()

    expect(mockWs.mock.send).not.toHaveBeenCalled()
  })

  it('reconnects on unexpected disconnect with exponential backoff', async () => {
    const instances: ReturnType<typeof createMockWebSocket>[] = []

    for (let i = 0; i < 5; i++) {
      instances.push(createMockWebSocket())
    }

    let callIdx = 0
    const factory = vi.fn().mockImplementation(() => {
      return instances[callIdx++].instance
    })

    setWebSocketFactory(factory as unknown as (url: string) => WebSocket)

    const client = createClient()
    client.connect()

    // First connection opens
    instances[0].mock.triggerOnopen()
    expect(stateChanges).toContain('connected')

    // Simulate unexpected disconnect → schedule reconnect at 1s
    instances[0].mock.triggerOnclose(1006)
    expect(stateChanges).toContain('reconnecting')

    // Wait 1s for first reconnect attempt
    vi.advanceTimersByTime(1000)
    expect(factory).toHaveBeenCalledTimes(2)

    // Second connection opens → counter resets to 0
    instances[1].mock.triggerOnopen()
    expect(stateChanges.filter((s) => s === 'connected').length).toBe(2)

    // Disconnect again → schedule reconnect at 1s (counter was reset)
    instances[1].mock.triggerOnclose(1006)

    // Wait 1s for next reconnect attempt
    vi.advanceTimersByTime(1000)
    expect(factory).toHaveBeenCalledTimes(3)

    // Third connection opens → counter resets
    instances[2].mock.triggerOnopen()

    // Disconnect again → schedule reconnect at 1s
    instances[2].mock.triggerOnclose(1006)

    // Wait 1s for next reconnect attempt
    vi.advanceTimersByTime(1000)
    expect(factory).toHaveBeenCalledTimes(4)

    // Fourth connection opens → counter resets
    instances[3].mock.triggerOnopen()
  })

  it('exhausts reconnection attempts when server stays down', () => {
    const instances: ReturnType<typeof createMockWebSocket>[] = []

    for (let i = 0; i < 5; i++) {
      instances.push(createMockWebSocket())
    }

    let callIdx = 0
    const factory = vi.fn().mockImplementation(() => {
      return instances[callIdx++].instance
    })

    setWebSocketFactory(factory as unknown as (url: string) => WebSocket)

    const client = createClient()
    client.connect()

    // First connection opens
    instances[0].mock.triggerOnopen()
    expect(stateChanges).toContain('connected')

    // Disconnect → reconnect attempt 1 at 1s
    instances[0].mock.triggerOnclose(1006)
    vi.advanceTimersByTime(1000)
    expect(factory).toHaveBeenCalledTimes(2)

    // Connection 2 → closes immediately (server down)
    instances[1].mock.triggerOnclose(1006)

    // reconnect attempt 2 at 2s
    vi.advanceTimersByTime(2000)
    expect(factory).toHaveBeenCalledTimes(3)

    // Connection 3 → closes immediately
    instances[2].mock.triggerOnclose(1006)

    // reconnect attempt 3 at 4s
    vi.advanceTimersByTime(4000)
    expect(factory).toHaveBeenCalledTimes(4)

    // Connection 4 → closes immediately
    instances[3].mock.triggerOnclose(1006)

    // No more attempts (max 3 reached)
    vi.advanceTimersByTime(8000)
    expect(factory).toHaveBeenCalledTimes(4)
    expect(stateChanges).toContain('disconnected')
  })

  it('emits partial text on partial frame', () => {
    const client = createClient()
    client.connect()
    mockWs.mock.triggerOnopen()

    mockWs.mock.triggerOnmessage(JSON.stringify({ type: 'partial', text: 'Hello' }))

    expect(partialTexts).toEqual(['Hello'])
  })

  it('emits final text and usage on final frame', () => {
    const client = createClient()
    client.connect()
    mockWs.mock.triggerOnopen()

    mockWs.mock.triggerOnmessage(
      JSON.stringify({
        type: 'final',
        text: 'Final transcription',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      }),
    )

    expect(finalResults).toEqual([
      {
        text: 'Final transcription',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      },
    ])
  })

  it('emits error message on error frame', () => {
    const client = createClient()
    client.connect()
    mockWs.mock.triggerOnopen()

    mockWs.mock.triggerOnmessage(
      JSON.stringify({ type: 'error', message: 'Something went wrong' }),
    )

    expect(errors).toEqual(['Something went wrong'])
  })

  it('stops reconnecting when disconnect is called', () => {
    const instances: ReturnType<typeof createMockWebSocket>[] = []

    for (let i = 0; i < 3; i++) {
      instances.push(createMockWebSocket())
    }

    let callIdx = 0
    const factory = vi.fn().mockImplementation(() => {
      return instances[callIdx++].instance
    })
    setWebSocketFactory(factory as unknown as (url: string) => WebSocket)

    const client = createClient()
    client.connect()
    instances[0].mock.triggerOnopen()

    // Disconnect
    instances[0].mock.triggerOnclose(1006)
    expect(stateChanges).toContain('reconnecting')

    // Call disconnect before reconnect timer fires
    client.disconnect()

    // Advance time past reconnect delay
    vi.advanceTimersByTime(2000)

    // Should NOT have created a new WebSocket
    expect(factory).toHaveBeenCalledTimes(1)
    expect(stateChanges).toContain('disconnected')
  })

  it('resets reconnect counter on successful reconnect', () => {
    const instances: ReturnType<typeof createMockWebSocket>[] = []

    for (let i = 0; i < 5; i++) {
      instances.push(createMockWebSocket())
    }

    let callIdx = 0
    const factory = vi.fn().mockImplementation(() => {
      return instances[callIdx++].instance
    })
    setWebSocketFactory(factory as unknown as (url: string) => WebSocket)

    const client = createClient()
    client.connect()

    // First connection
    instances[0].mock.triggerOnopen()

    // Disconnect and reconnect
    instances[0].mock.triggerOnclose(1006)
    vi.advanceTimersByTime(1000)
    instances[1].mock.triggerOnopen()

    // After reconnect, disconnect again - should still have attempts left
    instances[1].mock.triggerOnclose(1006)
    vi.advanceTimersByTime(1000)

    // Should have attempted another reconnect (counter was reset)
    expect(factory).toHaveBeenCalledTimes(3)
  })

  it('getState returns current state', () => {
    const client = createClient()
    expect(client.getState()).toBe('disconnected')

    client.connect()
    expect(client.getState()).toBe('connecting')

    mockWs.mock.triggerOnopen()
    expect(client.getState()).toBe('connected')
  })
})
