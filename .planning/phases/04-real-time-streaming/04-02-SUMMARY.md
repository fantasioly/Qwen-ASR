---
phase: 04-real-time-streaming
plan: 02
subsystem: streaming
tags: [websocket, streaming, audio, react-hooks, vitest]

requires:
  - phase: 04-01-backend-ws-streaming
    provides: WebSocket endpoint /ws/transcribe, frame protocol
provides:
  - StreamingClient class with WS lifecycle and exponential backoff reconnect
  - useStreamingTranscribe hook with microphone capture at 16kHz PCM
  - Audio level meter data (0-1 range) from AnalyserNode
  - Partial/final transcription text tracking
affects:
  - 04-03 (frontend streaming panel UI)
  - Phase 5 validation

tech-stack:
  added: []
  patterns:
    - Injectable WebSocket factory for testability
    - TDD with Vitest for client-side infrastructure
    - ScriptProcessorNode for PCM16 audio extraction

key-files:
  created:
    - frontend/src/api/streaming.ts
    - frontend/src/api/streaming.test.ts
    - frontend/src/hooks/useStreamingTranscribe.ts
    - frontend/src/hooks/useStreamingTranscribe.test.ts
  modified: []

key-decisions:
  - "StreamingClient uses injected WebSocket factory for testability"
  - "Reconnect counter resets on successful reconnect (3 attempts per cycle)"
  - "ScriptProcessorNode for PCM extraction (simpler than AudioWorklet for MVP)"
  - "AudioContext at 16kHz — browser handles device rate resampling"

requirements-completed: [RT-01, RT-05]

duration: 13min
completed: 2026-05-05
---

# Phase 4 Plan 02: Streaming Client & Audio Capture Summary

**StreamingClient WebSocket client with exponential backoff reconnect and useStreamingTranscribe hook with 16kHz microphone capture**

## Performance

- **Duration:** 13 min
- **Started:** 2026-05-05T14:12:09Z
- **Completed:** 2026-05-05T14:25:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- WebSocket streaming client with connect/disconnect lifecycle, audio/start/stop frame sending, and exponential backoff reconnection (1s, 2s, 4s, up to 3 attempts)
- React hook capturing microphone at 16kHz mono PCM via AudioContext + ScriptProcessorNode with base64 encoding
- Audio level meter from AnalyserNode, elapsed seconds timer, partial/final transcription state tracking
- Full TDD test coverage: 14 tests for StreamingClient, 4 tests for useStreamingTranscribe (all 129 project tests green)

## Task Commits

1. **Task 1: Create WebSocket client with reconnect logic** - `f3c931f` (feat)
2. **Task 2: Create useStreamingTranscribe hook with audio capture** - `aaeb1e0` (feat)

## Files Created/Modified
- `frontend/src/api/streaming.ts` - StreamingClient with WS lifecycle, exponential backoff, frame protocol
- `frontend/src/api/streaming.test.ts` - 14 tests covering connect, send, reconnect, frame handling
- `frontend/src/hooks/useStreamingTranscribe.ts` - React hook for live audio capture + streaming
- `frontend/src/hooks/useStreamingTranscribe.test.ts` - 4 tests for recording lifecycle and state

## Decisions Made
- Injectable WebSocket factory (`setWebSocketFactory`) enables unit testing without globals
- Reconnect counter resets on each successful connection (3 attempts per disconnect cycle)
- ScriptProcessorNode chosen over AudioWorklet for MVP simplicity (deprecated but universally supported)
- `AudioContext({ sampleRate: 16000 })` delegates resampling to browser
- Language extraction looks for `<language>XX</language>` or `language XX` prefix patterns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] WebSocket factory injection pattern**
- **Found during:** Task 1 (StreamingClient testing)
- **Issue:** jsdom doesn't provide `WebSocket` global, making direct `new WebSocket()` impossible to mock in tests. Direct `vi.stubGlobal` doesn't reach module-scoped references due to Vite bundling.
- **Fix:** Added `setWebSocketFactory()` function that injects a mock WebSocket creator. Production code uses lazy `getWebSocketFactory()` that resolves to `new WebSocket()` by default.
- **Files modified:** frontend/src/api/streaming.ts
- **Verification:** All 14 tests pass, factory is null-checked before use
- **Committed in:** f3c931f (Task 1 commit)

**2. [Rule 1 - Bug] Duplicate 'connected' state emission**
- **Found during:** Task 1 (reconnection test)
- **Issue:** `onConnect()` called both `setState('connected')` and explicit `onStateChange('connected')`, emitting duplicate state events that broke reconnect counter assertions.
- **Fix:** Removed duplicate `onStateChange('connected')` call — `setState()` already triggers `onStateChange`.
- **Files modified:** frontend/src/api/streaming.ts
- **Verification:** Reconnection test passes with correct state transition count
- **Committed in:** f3c931f (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Factory injection improves testability beyond plan scope. Duplicate event fix is correctness guarantee.

## Issues Encountered
- jsdom lacks `WebSocket` and `AudioContext` — solved with factory injection and class-based mock
- vitest `vi.fn()` isn't a constructor — switched to `setWebSocketFactory` accepting plain functions
- `navigator.stubGlobal` ordering — ensured `vi.stubGlobal` fires before `renderHook` in each test

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- StreamingClient ready for use by Phase 4 Plan 3 (streaming UI panel)
- useStreamingTranscribe hook provides all data needed: `isRecording`, `wsState`, `partialText`, `finalText`, `finalUsage`, `audioLevel`, `elapsedSeconds`
- Vite proxy for `/ws` configured in vite.config.ts (from Phase 1)
- No blockers for Plan 03

---
*Phase: 04-real-time-streaming*
*Completed: 2026-05-05*
