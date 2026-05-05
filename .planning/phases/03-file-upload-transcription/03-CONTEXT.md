# Phase 3: File Upload Transcription - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

File upload flow with drag-drop interaction, multi-file sequential processing, progress feedback per file, and transcription result cards with language detection, token stats, and copy functionality. Frontend integrates with existing backend `POST /api/transcribe` endpoint.

</domain>

<decisions>
## Implementation Decisions

### Upload Interaction
- **D-01:** Drag-drop zone with click fallback for file selection. New component needed — no drag-drop pattern exists in codebase yet.
- **D-02:** Multiple files allowed — user selects multiple files, each processed sequentially.
- **D-03:** Sequential queue — one result card per file, appended to the result list as each completes. All results visible together.
- **D-04:** Client-side file size check before upload. Reject oversized files with friendly toast. Threshold to be determined by research (suggested: 50MB based on 30s timeout + typical audio bitrate).

### Progress & Feedback
- **D-05:** Inline progress bar per file with status label (e.g., "Uploading...", "Processing...", "Complete"). Transitions through three visual states.
- **D-06:** Processing time (processing_time_ms from backend) shown in result stats alongside token usage.

### Result Display
- **D-07:** Result card header: filename + language badge + timestamp. Complete context per result.
- **D-08:** Copy to clipboard: clipboard icon button in result card header. Uses sonner toast for confirmation (already in use per D-16).
- **D-09:** Token usage stats (prompt tokens, completion tokens, processing time) as always-visible metadata badges near the result header. Scannable for cross-file comparison.

### Error & Edge Cases
- **D-10:** Specialized timeout message with actionable guidance: "File too large — try a shorter clip or convert to a smaller format." Maps to backend 504 response.
- **D-11:** Client-side format validation — block unsupported formats at upload with toast: "Unsupported format. Use WAV, MP3, M4A, OGG, FLAC, WEBM, MP4."
- **D-12:** Empty transcription result: show "No speech detected" placeholder in the result card. Distinguishes from error state.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and phase boundary
- `.planning/REQUIREMENTS.md` — FILE-01 to FILE-05 requirements with traceability
- `.planning/PROJECT.md` — Model deployment details, API endpoint, constraints

### Prior Phase Context
- `.planning/phases/01-backend-foundation/01-CONTEXT.md` — Backend decisions (D-01 to D-10), especially D-04 (OpenAI SDK), D-05 (no preprocessing), D-06 (metadata in response), D-08 (structured errors)
- `.planning/phases/02-frontend-connection-test/02-CONTEXT.md` — Frontend decisions (D-10 to D-17), especially D-10 (tab navigation), D-16 (sonner toasts)

### Existing Backend Code
- `backend/app/routers/transcribe.py` — POST `/api/transcribe` endpoint, accepts UploadFile, returns JSON with text/langauge/usage/processing_time_ms
- `backend/app/config.py` — Settings including request_timeout, api_base_url, api_key
- `backend/app/errors.py` — structured_error helper for consistent error responses

### Existing Frontend Code
- `frontend/src/App.tsx` — Tab routing, `fileupload` tab currently shows TabPlaceholder
- `frontend/src/types/tab.ts` — TabId type includes 'fileupload', TABS array defines label "File Upload"
- `frontend/src/api/health.ts` — API call pattern with AbortSignal, error handling, typed responses
- `frontend/src/components/connection/ConnectionTestPanel.tsx` — Toast error pattern (sonner), error message mapping

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sonner` (toasts) — already configured, use for all notifications (D-16)
- `lucide-react` (icons) — already used for RefreshCw, Loader2 in ConnectionTestPanel
- Tab infrastructure — `TabBar` component, `TabId`/`TABS` types, placeholder slot in `App.tsx`
- Backend `POST /api/transcribe` — fully functional, accepts UploadFile, returns structured JSON

### Established Patterns
- API calls use `fetch` with `AbortSignal`, typed response interfaces
- Error handling: backend returns `{error, message, code}`, frontend maps to toast messages
- Component structure: `src/components/{feature}/` directory, panel as default export
- `useHealth` hook pattern — custom hooks encapsulate API calls + state management

### Integration Points
- Replace `TabPlaceholder` for `fileupload` tab with new `FileUploadPanel` component
- Backend transcribe endpoint already wired — frontend calls `POST /api/transcribe` with FormData
- Vite proxy: `/api` → `http://localhost:8000` (configured in vite.config.ts)
- CORS enabled for `http://localhost:5173`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-File Upload Transcription*
*Context gathered: 2026-05-05*
