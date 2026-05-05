# Phase 4: Real-Time Streaming - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Microphone audio capture with WebSocket streaming and incremental transcription display. Frontend captures live audio, resamples to 16kHz, streams via WebSocket to new backend endpoint, which proxies to vLLM's WebSocket. User sees real-time transcription results, language detection, and connection status.

</domain>

<decisions>
## Implementation Decisions

### Recording UX
- **D-18:** Toggle record button — single button toggles between "Start Recording" (green) → "Stop Recording" (red). Visual state change communicates status clearly.
- **D-19:** Audio level meter + pulsing indicator + timer during recording. Shows confidence that mic is capturing. Requires Web Audio API AnalyserNode for real-time level meter.
- **D-20:** Controls top, results below layout. Recording button, audio meter, and timer at top. Streaming transcription text scrolls below. Natural reading flow.

### WebSocket Architecture
- **D-21:** Backend WebSocket endpoint → vLLM WebSocket proxy. New endpoint (e.g., `WS /ws/transcribe`). Frontend sends audio chunks, backend relays to vLLM WebSocket, streams partial results back.
- **D-22:** Continuous small chunks (~100ms). Low latency streaming, sends PCM audio every ~100ms. Higher message overhead but real-time feel.
- **D-23:** JSON frames protocol. Front→Back: `{type:'audio', data:'base64...'}`. Back→Front: `{type:'partial', text:'...'}` / `{type:'final', text:'...'}` / `{type:'error', message:'...', code:N}`. Debuggable and proxy-friendly.

### Incremental Display
- **D-24:** Live append with streaming cursor. Each incremental result appends to text area with visible streaming indicator. Better corrections replace previous text.
- **D-25:** Language badge updates in real-time. Shows as soon as model returns first detection, updates in-place if model revises it. Visual feedback: "en" badge that updates.
- **D-26:** Final result card matches File Upload ResultCard. After recording stops, result displays in same format: transcription text, language badge, token stats, copy button. Cross-tab consistency.

### Reconnection & Errors
- **D-27:** Auto-reconnect with resume on disconnect. Up to 3 attempts with 1s exponential backoff. If reconnect succeeds mid-recording, resume streaming. If all fail, show error toast and stop.
- **D-28:** Inline error banner for initial connect failure. "Cannot connect to server" banner in panel. Button stays disabled. Auto-reconnect attempt after 3s.
- **D-29:** Always-visible status dot. Small colored dot near recording controls: green=connected, yellow=reconnecting, red=disconnected. Pattern from Phase 2 HealthStatus component.

### Audio Processing
- **D-30:** Browser-side resampling with Web Audio API. Uses AudioContext + ScriptProcessorNode to capture, resample to 16kHz mono PCM, and chunk for WebSocket streaming. No server resampling needed.
- **D-31:** Base64-encoded PCM in JSON WebSocket frames. Each frame: `{type:'audio', data:'base64...'}`. Slightly larger (~33% overhead) but proxy-friendly, debuggable, and matches Phase 1 base64 pattern.

### Agent Discretion
- Exact WebSocket endpoint path (suggested: `/ws/transcribe`)
- Exact chunk size and timing (suggested: 100ms intervals, ~1600 bytes per chunk at 16kHz mono 16-bit)
- ScriptProcessorNode or AudioWorklet choice (AudioWorklet is modern, ScriptProcessorNode is deprecated but simpler)
- Streaming text cursor animation style
- Language confidence threshold for display

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and phase boundary
- `.planning/REQUIREMENTS.md` — RT-01 to RT-06 requirements with traceability
- `.planning/PROJECT.md` — Model deployment details, API endpoint, WebSocket streaming context

### Prior Phase Context
- `.planning/phases/01-backend-foundation/01-CONTEXT.md` — Backend decisions (D-01 to D-10), especially D-04 (OpenAI SDK), D-05 (no preprocessing — resampling will happen in browser), D-06 (metadata in response), D-08 (structured errors)
- `.planning/phases/02-frontend-connection-test/02-CONTEXT.md` — Frontend decisions (D-10 to D-17), especially D-10 (tab navigation), D-12 (status indicator pattern), D-16 (sonner toasts)
- `.planning/phases/03-file-upload-transcription/03-CONTEXT.md` — File upload decisions (D-01 to D-12), especially D-05 (progress states), D-06 (processing time), D-07 (result card header format), D-08 (clipboard copy), D-09 (token stats)

### Existing Backend Code
- `backend/app/main.py` — FastAPI app with CORS, router registration, existing endpoints
- `backend/app/routers/transcribe.py` — REST transcription endpoint (current vLLM integration via OpenAI SDK)
- `backend/app/config.py` — Settings including api_base_url, api_key, request_timeout

### Existing Frontend Code
- `frontend/src/App.tsx` — Tab routing. `realtime` tab currently shows `TabPlaceholder` (Phase 4 target)
- `frontend/src/types/tab.ts` — TabId type includes 'realtime', TABS array defines label "Real-Time"
- `frontend/src/api/health.ts` — API call pattern (fetch-based, not WebSocket)
- `frontend/src/api/transcribe.ts` — XHR-based file upload (current REST transcription)
- `frontend/src/components/connection/HealthStatus.tsx` — Status dot pattern (green/red/yellow)
- `frontend/src/components/fileupload/ResultCard.tsx` — Result card format to reuse (D-26)
- `frontend/src/hooks/useTranscribeQueue.ts` — Queue hook pattern (reference for streaming hook)

### WebSocket Reference
- vLLM WebSocket protocol — OpenAI-compatible streaming. Backend WebSocket needs to match vLLM's expectations. No formal spec exists — research will need to determine the exact WS protocol.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HealthStatus.tsx` — Green/red/yellow status dot component. Pattern for D-29 (always-visible status).
- `ResultCard.tsx` — Result card with text, language badge, token stats, copy button. Reuse for D-26 (final streaming result).
- `sonner` (toasts) — Already configured. Use for D-28 (connect error toast) and D-27 (reconnect status).
- `lucide-react` (icons) — Already used for RefreshCw, Loader2, etc. Will need Mic, Square (stop), Volume2 icons.
- Tab infrastructure — `TabBar`, `TabId`/`TABS` types. `realtime` tab is placeholder, ready for wiring.
- Backend `settings` — `api_base_url`, `api_key`, `request_timeout` settings already configurable.

### Established Patterns
- Component structure: `src/components/{feature}/` directory, panel as default export
- Hook pattern: `useCamelCase` hooks encapsulate API calls + state management
- Error handling: Backend returns `{error, message, code}`. Frontend maps to sonner toasts.
- WebSocket: **No existing WebSocket code** — will be new in this phase. Research needed for vLLM WS protocol.
- Audio processing: **No AudioContext/ScriptProcessorNode pattern** — new capability.

### Integration Points
- Replace `TabPlaceholder` for `realtime` tab with new `RealTimePanel` component
- WebSocket endpoint: New backend route (`ws /ws/transcribe`) to be added
- Backend needs WebSocket dependency (e.g., `websockets` or FastAPI's built-in WebSocket support)
- Frontend WebSocket client needs to integrate with existing error handling and toast patterns
- AudioContext needs to run in browser — requires HTTPS or localhost (dev server is localhost, fine)

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond what was captured in decisions — standard WebSocket streaming patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Real-Time Streaming*
*Context gathered: 2026-05-05*
