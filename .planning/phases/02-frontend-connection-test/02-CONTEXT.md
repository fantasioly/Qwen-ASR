# Phase 2: Frontend + Connection Test - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Build React + TypeScript frontend with dashboard layout, connection test panel with live status indicator, and configurable settings panel. Frontend consumes FastAPI backend from Phase 1 via HTTP (CORS already configured).

</domain>

<decisions>
## Implementation Decisions

### Layout & Navigation
- **D-10:** Tab切换 navigation — Tab labels at top, content area below. Tabs include: Connection Test (Phase 2), File Upload (Phase 3), Real-Time (Phase 4), Settings
- **D-11:** Tailwind CSS + shadcn/ui component library — modern, lightweight, customizable, standard for React projects

### Connection Test Panel (CONN-01 to CONN-04)
- **D-12:** Large status indicator — green/red dot + model name + latency in milliseconds. Visual health indicator always visible at top of panel
- **D-13:** Polling-based status refresh (no WebSocket yet — Phase 4). User can trigger manual refresh button

### Settings Panel (UI-02)
- **D-14:** Form-style layout — each setting on one line: label + input field + save button. Settings match Phase 1 backend fields: api_base_url, api_key, port, cors_origins, request_timeout, model_name
- **D-15:** Settings persist to backend via PUT `/api/settings` (Phase 1 already writes `.env` and updates in-memory)

### Error Handling (UI-03)
- **D-16:** Toast notifications (sonner library) — top-right popup, auto-dismiss, dismissible. Maps to backend structured error responses (D-08: error, message, code format)

### Responsive Design (UI-04)
- **D-17:** Desktop-first (targeted at 1920×1080 and 1366×768). No mobile-specific layout needed — PROJECT.md explicitly states desktop-first, web-only

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and phase boundary
- `.planning/REQUIREMENTS.md` — CONN-01 to CONN-04, UI-01 to UI-04 requirements
- `.planning/PROJECT.md` — Model deployment details, API endpoint, constraints, target users

### Phase 1 Context (Backend)
- `.planning/phases/01-backend-foundation/01-CONTEXT.md` — Backend API decisions (D-01 to D-10)
- `backend/app/main.py` — FastAPI app with CORS, router registration, endpoints
- `backend/app/routers/health.py` — GET `/api/health` returns `{status, model, latency_ms}`
- `backend/app/routers/settings.py` — GET/PUT `/api/settings` returns/updates config

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- FastAPI backend provides: GET `/api/health`, GET/PUT `/api/settings`, POST `/api/transcribe`
- Backend `settings` schema: `api_base_url`, `api_key`, `port`, `cors_origins`, `request_timeout`, `model_name`
- CORS configured for `http://localhost:5173`

### Established Patterns
- Project uses React + TypeScript + Vite (frontend), FastAPI (backend)
- All API calls go through backend (per AGENTS.md API proxy convention)
- Backend error responses use `{error, message, code}` JSON format (D-08)

### Integration Points
- Frontend communicates with backend via HTTP (CORS already enabled)
- Phase 1 backend runs on port 8000, frontend on port 5173 (Vite default)
- Future phases (3, 4) will add file upload and real-time streaming tabs

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

*Phase: 2-Frontend + Connection Test*
*Context gathered: 2026-05-05*
