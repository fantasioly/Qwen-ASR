# Phase 5: Cache & Polish - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Prompt caching visualization, performance comparison, error handling polish, and production readiness. Extends existing File Upload and Real-Time panels with cache hit/miss indicators, a cache comparison tool, retry-on-error UX, and consistent empty/loading states across all panels. No new tabs — all changes enhance existing panels.

</domain>

<decisions>
## Implementation Decisions

### Cache Info Display (CACHE-01, CACHE-03)
- **D-32:** Cache indicator inline on ResultCard header. Green badge with cache_read_tokens count for hits (e.g., "🟢 128 cached"), gray dash for misses. Extends existing token stats pattern — no UI restructure needed.
- **D-33:** Cache data from OpenAI SDK response.usage.prompt_tokens_details.cache_read_tokens. Backend must extract this field from the vLLM response and pass through to frontend. If cache_read_tokens > 0 → cache hit; if 0 or undefined → cache miss.
- **D-34:** Both File Upload ResultCard and Real-Time final result card get the cache indicator. Consistent across tabs. Requires updating TranscribeResponse type to include cache info.

### Cache Comparison Tool (CACHE-02)
- **D-35:** "⚡ Compare" button on ResultCard footer after file completion. Re-uploads the same file and appends a comparison result card below. First run = baseline (cache miss), second run = cached result. Comparison shows latency delta and cache status for both runs.
- **D-36:** Comparison result card variant — shows both results side-by-side or stacked with clear labels ("Without Cache" / "With Cache") and a delta badge ("X% faster"). Minimal new component — extends existing ResultCard with a comparison prop.

### Error Handling Polish (UI-03)
- **D-37:** Inline retry button on error states. When any panel operation fails, show error state with retry button — not just a toast. User recovers without reloading. Pattern: error message + "Retry" button in the result area where the failed output would appear.
- **D-38:** Improved error message mapping with actionable guidance. Map each error code to specific guidance:
  - 504 timeout → "Request took too long. Try a shorter audio clip."
  - 503 connection_failed → "Cannot reach vLLM server. Check network and API settings."
  - 500 transcription_failed → "Model error. Check Settings tab for correct API URL and key."
  - Network error → "Network unavailable. Check your connection."
- **D-39:** Error mapping centralized. Single error message map (both backend and frontend can reference) to ensure consistency. Could be frontend-side mapping from error code → message.

### UI Consistency & Edge Cases
- **D-40:** Empty states for all panels. Connection Test: "Test connection to see status". File Upload: "Drag or drop audio files here, or click to browse". Real-Time: "Click 'Start Recording' to begin live transcription". Settings: always populated (no empty state needed).
- **D-41:** Loading skeletons for async operations. Placeholder UI during fetch/stream that matches final layout shape. Prevents layout shift. Pattern: pulsing gray rectangles matching card dimensions. Reuse across Connection Test (health check), File Upload (processing), Real-Time (connecting).

### Agent Discretion
- Exact cache badge styling (icon choice, color, placement in ResultCard)
- Comparison card layout details (side-by-side vs stacked)
- Skeleton animation specifics (pulse speed, color tokens)
- Exact retry button copy and placement
- Whether to add a global error boundary (out of scope per decision, but agent may add if trivial)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and phase boundary
- `.planning/REQUIREMENTS.md` — CACHE-01 to CACHE-03, UI-03, UI-04 requirements with traceability
- `.planning/PROJECT.md` — Model deployment details, API endpoint, constraints

### Prior Phase Context
- `.planning/phases/01-backend-foundation/01-CONTEXT.md` — Backend decisions (D-01 to D-10), especially D-06 (metadata in response), D-08 (structured errors)
- `.planning/phases/02-frontend-connection-test/02-CONTEXT.md` — Frontend decisions (D-10 to D-17), especially D-12 (status indicator), D-16 (sonner toasts)
- `.planning/phases/03-file-upload-transcription/03-CONTEXT.md` — File upload decisions (D-01 to D-12), especially D-07 (result card header), D-09 (token stats), D-10 (timeout message), D-12 (empty result)
- `.planning/phases/04-real-time-streaming/04-CONTEXT.md` — Real-time decisions (D-18 to D-31), especially D-26 (final result matches ResultCard), D-27 to D-29 (reconnection/errors)

### Existing Backend Code
- `backend/app/routers/transcribe.py` — POST `/api/transcribe` endpoint. Response needs cache_read_tokens from vLLM usage. Current response shape: `{text, language, usage, processing_time_ms}`.
- `backend/app/routers/streaming.py` — WebSocket streaming. Final result also needs cache info. `call_http_transcription` returns text/lang — needs to also return usage data.
- `backend/app/errors.py` — `structured_error()` helper. Error codes: timeout(504), connection_failed(503), transcription_failed(500).
- `backend/app/config.py` — Settings including api_base_url, api_key, request_timeout, model_name.

### Existing Frontend Code
- `frontend/src/types/transcribe.ts` — TranscribeResponse/TranscribeUsage/TranscribeError types. Needs cache_read_tokens field added.
- `frontend/src/api/transcribe.ts` — XHR-based uploadAudio. Response parsing needs cache extraction.
- `frontend/src/api/streaming.ts` — WebSocket client for real-time streaming. Final result handling needs cache info.
- `frontend/src/api/health.ts` — Health check with error handling pattern.
- `frontend/src/components/fileupload/ResultCard.tsx` — Result card with text, language badge, token stats, copy button. Target for cache indicator and compare button.
- `frontend/src/components/fileupload/FileUploadPanel.tsx` — Panel wiring, queue management, error toast handling.
- `frontend/src/components/realtime/RealTimePanel.tsx` — Streaming panel with recording controls, streaming text, final result display.
- `frontend/src/components/realtime/RecordingControls.tsx` — Start/stop recording button with status dot.
- `frontend/src/components/connection/ConnectionTestPanel.tsx` — Health status, latency history, error handling.
- `frontend/src/App.tsx` — Tab routing, tab placeholder pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ResultCard.tsx` — Exists in fileupload. Reuse/wire to RealTime panel for final result (D-26). Extend with cache badge and compare button props.
- `sonner` (toasts) — Already configured for all notifications. Continue using for non-retryable errors.
- `lucide-react` (icons) — Already used throughout. Will need Zap (compare), AlertCircle (error), Loader2 (loading), CheckCircle (cache hit), XCircle (cache miss) icons.
- `HealthStatus.tsx` — Green/red/yellow status dot. Pattern for cache indicator color coding.
- `useTranscribeQueue.ts` — Queue hook with job status management. Error job state already defined (`status: 'failed'`). Extend for compare jobs.

### Established Patterns
- Backend response: structured JSON with `text`, `language`, `usage`, `processing_time_ms`. Add `cache_hit` and `cache_read_tokens` to maintain pattern.
- Error handling: backend `structured_error(error, message, code)` → frontend toast with `sonner.error()`. Phase 5 adds retry buttons alongside toasts.
- Component structure: `src/components/{feature}/` directory, panel as default export, small sub-components.
- Hook pattern: `useCamelCase` hooks encapsulate API calls + state management.
- Tailwind CSS v4, lucide-react icons, sonner toasts — consistent stack.

### Integration Points
- **TranscribeResponse type** — Add `cache_hit: boolean`, `cache_read_tokens: number`. Propagates to all consumers.
- **Backend transcribe.py** — Extract `response.usage.prompt_tokens_details.cache_read_tokens` from OpenAI SDK response. Add to JSONResponse.
- **Backend streaming.py** — `call_http_transcription` needs to return usage data alongside text/lang. Propagate to WebSocket final frame.
- **ResultCard** — Add cache badge to header, compare button to footer. Backward compatible with existing props.
- **Error handling** — Centralized error message map. Add retry button pattern to FileUploadPanel, RealTimePanel, ConnectionTestPanel.
- **Empty states** — Add to FileUploadPanel, RealTimePanel, ConnectionTestPanel (when no health check done yet).

</code_context>

<specifics>
## Specific Ideas

No specific references beyond what was captured in decisions — standard cache visualization and error recovery patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Cache & Polish*
*Context gathered: 2026-05-06*
