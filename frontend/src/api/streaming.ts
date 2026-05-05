/**
 * WebSocket streaming client for real-time audio transcription.
 *
 * Handles WebSocket lifecycle, reconnection with exponential backoff,
 * and frame-based message protocol for bidirectional audio streaming.
 *
 * Protocol (frontend → backend):
 *   { type: 'audio', data: 'base64...' }  // Audio chunk
 *   { type: 'start' }                      // Commit non-final
 *   { type: 'stop' }                       // Commit final
 *
 * Protocol (backend → frontend):
 *   { type: 'connected' }
 *   { type: 'partial', text: '...' }
 *   { type: 'final', text: '...', usage: { prompt_tokens, completion_tokens } }
 *   { type: 'error', message: '...', code: N }
 */

export interface StreamingFrame {
  type: 'audio' | 'start' | 'stop'
  data?: string
}

export interface StreamingResponse {
  type: 'connected' | 'partial' | 'final' | 'error'
  text?: string
  usage?: { prompt_tokens: number; completion_tokens: number }
  message?: string
  code?: number
}

export type StreamingState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

/**
 * Factory for creating WebSocket instances.
 * Exposed for testing — allows injection of mock WebSocket functions.
 */
let webSocketFactory: ((url: string) => WebSocket) | null = null

/**
 * Gets the WebSocket factory, lazily resolving to the global if not set.
 */
function getWebSocketFactory(): (url: string) => WebSocket {
  if (webSocketFactory !== null) return webSocketFactory
  return (url: string) => new WebSocket(url)
}

/**
 * Sets a custom WebSocket factory (for testing).
 * Pass a function that returns a WebSocket-like object.
 * Call with `null` to restore the default browser WebSocket.
 */
export function setWebSocketFactory(factory: ((url: string) => WebSocket) | null): void {
  webSocketFactory = factory
}

/**
 * WebSocket client with automatic reconnection for streaming transcription.
 *
 * Uses exponential backoff (1s, 2s, 4s) with max 3 reconnect attempts.
 * Callbacks are invoked for state changes, partial text, final results, and errors.
 */
export class StreamingClient {
  private ws: WebSocket | null = null
  private state: StreamingState = 'disconnected'
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 3
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isConnected = false
  private isIntentionalDisconnect = false

  constructor(
    private onStateChange: (state: StreamingState) => void,
    private onPartial: (text: string) => void,
    private onFinal: (
      text: string,
      usage?: { prompt_tokens: number; completion_tokens: number },
    ) => void,
    private onError: (message: string) => void,
  ) {}

  /**
   * Opens a WebSocket connection to the streaming endpoint.
   */
  connect(): void {
    if (this.isConnected || this.ws !== null) {
      return
    }

    this.isIntentionalDisconnect = false
    this.setState('connecting')

    try {
      this.ws = getWebSocketFactory()('/ws/transcribe')

      this.ws.onopen = () => {
        this.onConnect()
      }

      this.ws.onmessage = (e: MessageEvent) => {
        this.handleMessage(e.data)
      }

      this.ws.onclose = (e: CloseEvent) => {
        this.onDisconnect(e.code)
      }

      this.ws.onerror = () => {
        // onclose will fire after onerror, handle there
      }
    } catch {
      this.setState('disconnected')
      this.onError('Failed to create WebSocket connection')
    }
  }

  /**
   * Closes the WebSocket connection and cancels any pending reconnection.
   */
  disconnect(): void {
    this.isIntentionalDisconnect = true
    this.cancelReconnect()

    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // WebSocket already closed
      }
      this.ws = null
    }

    this.isConnected = false
    this.setState('disconnected')
  }

  /**
   * Sends an audio chunk as base64-encoded PCM16 data.
   * Only sends if WebSocket is connected.
   */
  sendAudio(base64: string): void {
    if (!this.isConnected || !this.ws) return
    this.sendFrame({ type: 'audio', data: base64 })
  }

  /**
   * Signals the server to commit the current audio buffer for incremental processing.
   */
  start(): void {
    if (!this.isConnected || !this.ws) return
    this.sendFrame({ type: 'start' })
  }

  /**
   * Signals the server to finalize the current audio buffer (end of streaming).
   */
  stop(): void {
    if (!this.isConnected || !this.ws) return
    this.sendFrame({ type: 'stop' })
  }

  /**
   * Returns the current connection state.
   */
  getState(): StreamingState {
    return this.state
  }

  private sendFrame(frame: StreamingFrame): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(frame))
    }
  }

  private setState(newState: StreamingState): void {
    this.state = newState
    this.onStateChange(newState)
  }

  private onConnect(): void {
    this.isConnected = true
    this.reconnectAttempts = 0
    this.setState('connected')
  }

  private handleMessage(raw: string): void {
    let frame: StreamingResponse
    try {
      frame = JSON.parse(raw)
    } catch {
      this.onError('Invalid JSON from server')
      return
    }

    switch (frame.type) {
      case 'connected':
        // Server confirms connection
        break
      case 'partial':
        this.onPartial(frame.text ?? '')
        break
      case 'final':
        this.onFinal(frame.text ?? '', frame.usage)
        break
      case 'error':
        this.onError(frame.message ?? 'Unknown error')
        break
    }
  }

  private onDisconnect(code: number): void {
    this.isConnected = false
    this.ws = null

    if (this.isIntentionalDisconnect) {
      // User called disconnect() — don't try to reconnect
      return
    }

    // Unexpected disconnect — schedule reconnection
    this.scheduleReconnect()
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('disconnected')
      return
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000 // 1s, 2s, 4s
    this.setState('reconnecting')

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}
