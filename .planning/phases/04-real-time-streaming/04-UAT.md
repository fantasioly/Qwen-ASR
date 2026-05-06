---
status: resolved
phase: 04-real-time-streaming
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md
started: "2026-05-05T14:30:00Z"
updated: "2026-05-06T08:25:00Z"
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: Navigate to Real-Time Tab
expected: |
  Clicking the "Real-Time" tab in the app shows the RealTimePanel with a recording button, timer display, and WebSocket connection status indicator.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: issue
reported: "Cannot connect to vLLM: server rejected WebSocket connection: HTTP 403"
severity: blocker
decision: "Switch to HTTP streaming workaround — accumulate audio chunks in backend WebSocket, call HTTP /v1/audio/transcriptions incrementally"

### 2. Navigate to Real-Time Tab
expected: Clicking the "Real-Time" tab in the app shows the RealTimePanel with a recording button, timer display, and WebSocket connection status indicator.
result: blocked
blocked_by: server
reason: "Qwen3-ASR-1.7B model does not support vLLM realtime WebSocket task (only transcribe/translate). HTTP /v1/audio/transcriptions works, but /v1/realtime returns 403"

### 3. Start Recording
expected: Clicking "Start Recording" triggers microphone permission prompt. After granting, button changes to show recording state (icon changes to Stop/Square), timer starts counting elapsed time.
result: blocked
blocked_by: server
reason: "vLLM /v1/realtime returns 403 — Qwen3-ASR lacks realtime WebSocket support. Requires architecture change to HTTP streaming workaround"

### 4. Audio Level Meter Responds to Sound
expected: While recording, the 4-segment audio meter lights up when user speaks. Segments are color-coded (green/yellow/red) based on volume level.
result: blocked
blocked_by: server
reason: "Depends on recording functionality (test 3)"

### 5. WebSocket Connection Status
expected: WebSocket connection status indicator shows current state - green dot when connected to backend, visual feedback for connection state changes.
result: issue
reported: "WebSocket connects to backend, but backend cannot bridge to vLLM (403). Shows connection error immediately"
severity: major

### 6. Incremental Transcription Updates
expected: While speaking during recording, transcription text updates incrementally in real-time with an animated cursor showing where new text is streaming in.
result: blocked
blocked_by: server
reason: "No streaming available — requires HTTP workaround implementation"

### 7. Stop Recording Shows Final Result
expected: Clicking stop recording ends the session. Final complete transcription is displayed in a result card with detected language and token usage stats.
result: blocked
blocked_by: server
reason: "Depends on recording functionality"

### 8. Copy Final Transcription
expected: Result card has a copy button that copies the final transcription text to clipboard with visual feedback.
result: blocked
blocked_by: server
reason: "Depends on transcription result availability"

## Summary

total: 8
passed: 1
issues: 2 (resolved in 04-04)
pending: 0
skipped: 0
blocked: 5 (unblocked by 04-04, pending re-test)

## Gaps

- truth: "Real-time streaming returns incremental transcription as user speaks"
  status: resolved
  reason: "vLLM WebSocket /v1/realtime endpoint returns 403 — Qwen3-ASR only supports HTTP /v1/audio/transcriptions, not realtime WebSocket protocol"
  severity: blocker
  test: 1
  root_cause: "Phase 4 was built around vLLM realtime WebSocket bridge, but Qwen3-ASR model does not implement SupportsRealtime (only SupportsTranscription). All WebSocket /v1/realtime connections are rejected with 403."
  resolution: "Rewrote streaming.py to HTTP periodic transcription via OpenAI HTTP client. Audio buffered as PCM16, transcribed every 3s, partial/final results sent over WebSocket to frontend."
  resolved_in: 04-04
  artifacts:
    - path: "backend/app/routers/streaming.py"
      issue: "Entire file implements WebSocket-to-vLLM-WebSocket bridge that cannot work"
  missing:
    - "Rewrite streaming.py: frontend WebSocket → audio buffer → HTTP /v1/audio/transcriptions → WebSocket to frontend"
    - "Audio chunk assembly: decode base64 chunks, concatenate into PCM16 WAV for HTTP upload"
    - "Streaming transcription: send audio in segments (e.g., 3-5s), return partial results incrementally"
    - "Update frontend StreamingClient protocol to handle incremental HTTP-based results"
  debug_session: ""

- truth: "WebSocket connection status shows real connection state"
  status: resolved
  reason: "WebSocket connects to backend successfully, but backend cannot forward to vLLM"
  severity: major
  test: 5
  root_cause: "Backend WebSocket accepts connections but fails to bridge to vLLM"
  resolution: "WebSocket now connects without attempting vLLM WS bridge. Connected frame sent immediately after accept."
  resolved_in: 04-04
  artifacts:
    - path: "frontend/src/api/streaming.ts"
      issue: "StreamingClient reconnects repeatedly due to backend connection failures"
  missing:
    - "Update StreamingClient state machine for HTTP-based streaming"
  debug_session: ""
  debug_session: ""
