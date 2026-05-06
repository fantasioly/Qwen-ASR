/**
 * React hook for real-time streaming audio transcription.
 *
 * Captures microphone audio, resamples to 16kHz mono PCM,
 * and streams via WebSocket to the backend for live transcription.
 *
 * Provides recording controls, audio level meter, elapsed timer,
 * partial/final transcription text, and WebSocket connection state.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { StreamingClient } from '@/api/streaming'

export interface UseStreamingTranscribeReturn {
  isRecording: boolean
  wsState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  partialText: string
  finalText: string
  finalUsage: { prompt_tokens: number; completion_tokens: number; cache_read_tokens: number } | null
  detectedLanguage: string
  elapsedSeconds: number
  audioLevel: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  error: string | null
}

/**
 * Extracts a 2-letter language code from transcription text.
 * Matches patterns like `<language>en</language>` or `language en` prefix.
 * Returns 'unknown' if no language detected.
 */
function extractLanguage(text: string): string {
  // Try XML tag pattern first: <language>XX</language>
  const xmlMatch = text.match(/<language>([a-z]{2})<\/language>/i)
  if (xmlMatch) return xmlMatch[1].toLowerCase()

  // Try prefix pattern: language XX at start
  const prefixMatch = text.match(/^language\s+([a-z]{2})/i)
  if (prefixMatch) return prefixMatch[1].toLowerCase()

  return 'unknown'
}

/**
 * Hook for real-time streaming transcription via WebSocket.
 *
 * - Captures microphone audio at 16kHz mono PCM
 * - Streams audio chunks via WebSocket
 * - Tracks partial and final transcription text
 * - Provides audio level meter (0-1 range)
 * - Tracks elapsed recording seconds
 * - Cleans up all resources on unmount
 */
export function useStreamingTranscribe(): UseStreamingTranscribeReturn {
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  // WebSocket state
  const [wsState, setWsState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected')

  // Transcription state
  const [partialText, setPartialText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [finalUsage, setFinalUsage] = useState<{ prompt_tokens: number; completion_tokens: number; cache_read_tokens: number } | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState('unknown')
  const [error, setError] = useState<string | null>(null)

  // Refs for mutable state in event handlers
  const clientRef = useRef<StreamingClient | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRecordingRef = useRef(false)

  // Initialize StreamingClient
  useEffect(() => {
    const client = new StreamingClient(
      // onStateChange
      (state) => setWsState(state),
      // onPartial
      (text) => setPartialText(text),
      // onFinal
      (text, usage) => {
        setFinalText(text)
        setFinalUsage(usage ?? null)
        setDetectedLanguage(extractLanguage(text))
      },
      // onError
      (msg) => {
        setError(msg)
      },
    )

    client.connect()
    clientRef.current = client

    return () => {
      client.disconnect()
    }
  }, [])

  /**
   * Starts microphone capture and streaming transcription.
   * Requests user permission, creates AudioContext at 16kHz,
   * and begins sending audio chunks via WebSocket.
   */
  const startRecording = useCallback(async () => {
    // Reset recording state
    setPartialText('')
    setFinalText('')
    setFinalUsage(null)
    setDetectedLanguage('unknown')
    setElapsedSeconds(0)
    setError(null)

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    // Create AudioContext at 16kHz (browser handles resampling)
    const audioCtx = new AudioContext({ sampleRate: 16000 })
    audioCtxRef.current = audioCtx

    // Set up audio processing chain
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256

    const processor = audioCtx.createScriptProcessor(1024, 1, 1)

    processor.onaudioprocess = (e) => {
      if (!isRecordingRef.current) return

      // Extract Float32Array and convert to PCM16 Int16Array
      const input = e.inputBuffer.getChannelData(0)
      const pcm16 = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      // Convert to base64
      let binary = ''
      for (let i = 0; i < pcm16.length; i++) {
        binary += String.fromCharCode(pcm16[i] & 0xff, (pcm16[i] >> 8) & 0xff)
      }
      const base64 = btoa(binary)

      // Send audio chunk via WebSocket
      clientRef.current?.sendAudio(base64)

      // Signal server to process non-final audio
      clientRef.current?.start()

      // Update audio level from analyser (0-1 range)
      const levels = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(levels)
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length
      setAudioLevel(avg / 255)
    }

    // Connect audio chain: source → analyser → processor → destination
    source.connect(analyser)
    analyser.connect(processor)
    processor.connect(audioCtx.destination)

    // Start elapsed time counter
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    timerRef.current = timer

    // Mark as recording
    isRecordingRef.current = true
    setIsRecording(true)
  }, [])

  /**
   * Stops recording, finalizes transcription, and cleans up resources.
   */
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return

    // Signal final commit to server
    clientRef.current?.stop()

    // Stop all audio tracks
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    // Close AudioContext
    audioCtxRef.current?.close()
    audioCtxRef.current = null

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    isRecordingRef.current = false
    setIsRecording(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (isRecordingRef.current) {
        stopRecording()
      }

      // Disconnect client
      clientRef.current?.disconnect()
      clientRef.current = null

      // Close AudioContext
      audioCtxRef.current?.close()
      audioCtxRef.current = null

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Stop all tracks
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return {
    isRecording,
    wsState,
    partialText,
    finalText,
    finalUsage,
    detectedLanguage,
    elapsedSeconds,
    audioLevel,
    startRecording,
    stopRecording,
    error,
  }
}
