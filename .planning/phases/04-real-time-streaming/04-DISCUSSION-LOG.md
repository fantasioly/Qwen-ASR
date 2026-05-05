# Phase 4: Real-Time Streaming - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 4-Real-Time Streaming
**Areas discussed:** Recording UX, WebSocket Architecture, Incremental Display, Reconnection & Errors, Audio Resampling

## Recording UX

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle button with visual state | Big record button toggles between start (green) → stop (red) | ✓ |
| Two separate buttons | Start / Stop as distinct buttons. More explicit but uses more space. | |
| You decide | the agent picks | |

**User's choice:** Toggle button with visual state

| Option | Description | Selected |
|--------|-------------|----------|
| Audio level meter + pulsing + timer | Real-time volume meter, red pulsing dot, elapsed timer | ✓ |
| Pulsing indicator + timer | Red pulsing dot + elapsed time only. | |
| Just button state change | Button changes to "Stop Recording" with red color. | |

**User's choice:** Audio level meter + pulsing + timer

| Option | Description | Selected |
|--------|-------------|----------|
| Controls top, results below | Recording button, audio meter, timer at top. Streaming text below. | ✓ |
| Controls bottom, results scroll above | Results take most space, controls pinned at bottom. | |
| You decide | the agent picks | |

**User's choice:** Controls top, results below

## WebSocket Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Backend WS → vLLM WS | New backend WS endpoint. Frontend → backend → vLLM. | ✓ |
| Frontend WS direct to vLLM | Bypasses FastAPI. Simpler backend. | |
| Backend REST chunked streaming | No WebSocket. Frontend POSTs chunks, backend uses SSE. | |

**User's choice:** Backend WS → vLLM WS

| Option | Description | Selected |
|--------|-------------|----------|
| Continuous small chunks | Send audio every 20-100ms as PCM. Low latency. | ✓ |
| Buffered chunks | Accumulate 500-1000ms before sending. | |
| You decide | the agent picks | |

**User's choice:** Continuous small chunks (~100ms)

| Option | Description | Selected |
|--------|-------------|----------|
| JSON frames | {type:'audio', data:'base64...'}, {type:'partial', text:'...'} | ✓ |
| Binary audio + JSON metadata | Raw PCM bytes for audio, JSON for metadata. | |
| You decide | the agent picks | |

**User's choice:** JSON frames with base64 PCM

## Incremental Display

| Option | Description | Selected |
|--------|-------------|----------|
| Live append with streaming cursor | Appends with cursor indicator. Corrections replace in-place. | ✓ |
| Replace entire text each update | Clean but may feel flickery. | |
| Append and keep old | Shows revision history but gets cluttered. | |

**User's choice:** Live append with streaming cursor

| Option | Description | Selected |
|--------|-------------|----------|
| Show as soon as available, update if changes | Badge appears on first detection, updates in-place. | ✓ |
| Show only final language after stop | Only shown after recording stops. | |
| You decide | the agent picks | |

**User's choice:** Show as soon as available, update if changes

| Option | Description | Selected |
|--------|-------------|----------|
| Same ResultCard style | Reuses File Upload card format. Text, language badge, stats, copy. | ✓ |
| Inline in results area | Streaming text becomes final result with metadata below. | |
| You decide | the agent picks | |

**User's choice:** Same ResultCard style

## Reconnection & Errors

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-reconnect and resume | 3 attempts, 1s backoff. Resume streaming if reconnect succeeds. | ✓ |
| Manual reconnect button | "Connection lost — click to reconnect". | |
| Stop recording, discard partial data | Disconnect is fatal. Simple but loses work. | |

**User's choice:** Auto-reconnect and resume

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error in panel | "Cannot connect" banner. Button disabled until reconnect. | ✓ |
| Toast notification only | Just a sonner toast. | |
| You decide | the agent picks | |

**User's choice:** Inline error in panel

| Option | Description | Selected |
|--------|-------------|----------|
| Always-visible status dot | Green/yellow/red dot near controls. Matches HealthStatus pattern. | ✓ |
| Banner only when not connected | No indicator when connected, full-width warning on problem. | |
| You decide | the agent picks | |

**User's choice:** Always-visible status dot

## Audio Resampling

| Option | Description | Selected |
|--------|-------------|----------|
| Browser-side with Web Audio API | AudioContext → resample → PCM chunks. No server overhead. | ✓ |
| Backend resamples | Send raw at native rate, backend resamples. | |
| You decide | the agent picks | |

**User's choice:** Browser-side with Web Audio API

| Option | Description | Selected |
|--------|-------------|----------|
| AudioContext + ScriptProcessorNode | Most control. Enables level meter and real-time streaming. | ✓ |
| MediaRecorder API | Simpler. Less control over chunking. | |
| You decide | the agent picks | |

**User's choice:** AudioContext + ScriptProcessorNode

| Option | Description | Selected |
|--------|-------------|----------|
| Base64-encoded in JSON frames | {type:'audio', data:'base64...'}. Proxy-friendly, debuggable. | ✓ |
| WebSocket binary frames | Raw PCM bytes. More efficient, harder to debug. | |
| You decide | the agent picks | |

**User's choice:** Base64-encoded in JSON frames

## Agent's Discretion

- WebSocket endpoint path (suggested: `/ws/transcribe`)
- Chunk size and timing (~100ms intervals, ~1600 bytes per chunk at 16kHz mono 16-bit)
- ScriptProcessorNode vs AudioWorklet choice
- Streaming text cursor animation style
- Language confidence threshold for display

## Deferred Ideas

None — discussion stayed within phase scope.
