import { useEffect, useRef } from 'react'

interface StreamingTextProps {
  text: string
  isStreaming: boolean
}

export default function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to bottom when text updates
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current
      el.scrollTop = el.scrollHeight
    }
  }, [text])

  if (!text.trim()) {
    return (
      <p className="text-sm text-gray-400 italic">
        Start recording to see transcription...
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto"
    >
      {text}
      {isStreaming && (
        <span
          ref={cursorRef}
          className="inline-block w-0.5 h-4 align-text-bottom bg-gray-600 animate-pulse ml-0.5"
        />
      )}
    </div>
  )
}
