# Phase 1: Backend Foundation - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish FastAPI backend server that proxies requests to the vLLM-deployed Qwen3-ASR-1.7B model. Delivers health check endpoint, transcription endpoint, configurable API settings, and CORS setup. No frontend in this phase — backend-only foundation for Phase 2+.

</domain>

<decisions>
## Implementation Decisions

### Config Management
- **D-01:** Use `.env` file + environment variables via `python-dotenv`. Pydantic Settings class for type-safe config access.
- **D-02:** Settings changes take effect immediately — configurable values kept in memory, settings endpoint writes both `.env` file and updates in-memory Pydantic Settings. No server restart needed.
- **D-03:** Default config: base URL `http://10.50.193.74:30003`, API key `test`, port `8000`.

### Transcription Endpoint
- **D-04:** Use `openai` Python SDK to call vLLM's OpenAI-compatible `/v1/chat/completions` endpoint. Send audio as base64 in chat message with system prompt.
- **D-05:** Minimal audio preprocessing — backend forwards uploaded audio file as-is to vLLM without resampling or format conversion. Keeps backend simple, lets model handle format.
- **D-06:** Response includes full metadata: transcription text, detected language, token usage (prompt/completion tokens), processing time.

### Health Endpoint
- **D-07:** GET `/api/health` calls vLLM's `/v1/models`, returns connectivity status (ok/error), loaded model name, and round-trip latency in milliseconds.

### Error Handling & Timeouts
- **D-08:** Structured JSON error responses: `{error, message, code}` format — e.g., `{error: 'timeout', message: 'API request timed out after 30s', code: 504}`.
- **D-09:** Configurable request timeout (default 30s), no automatic retry. Timeout value configurable via settings.

### CORS
- **D-10:** CORS configured to allow frontend origin. Default allows `http://localhost:5173` (Vite dev server).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and phase boundary
- `.planning/REQUIREMENTS.md` — CONN-01, UI-02 requirements traceability
- `.planning/PROJECT.md` — Model deployment details, API endpoint, constraints

### API Integration
- No external specs — vLLM uses standard OpenAI-compatible API format. The `openai` Python SDK documentation is the primary reference for chat completions with audio input.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing code. All files will be created in this phase.

### Established Patterns
- Tech stack locked: FastAPI (backend), Python, OpenAI-compatible API standard
- Audio: 16kHz mono PCM expected by model (per PROJECT.md constraints)

### Integration Points
- Backend runs locally, frontend serves static files or via dev server (Phase 2)
- API server at `10.50.193.74:30003` is on internal network — CORS and connectivity considerations

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

*Phase: 1-Backend Foundation*
*Context gathered: 2026-05-05*
