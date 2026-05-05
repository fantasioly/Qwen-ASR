---
phase: 04-real-time-streaming
plan: 01
subsystem: api
tags: [websocket, vllm, fastapi, streaming, websockets]

# Dependency graph
requires:
  - phase: 01-backend-foundation
    provides: FastAPI app, settings, router pattern, error handling
  - phase: 02-frontend-connection-test
    provides: Vite dev server with proxy config
provides:
  - WebSocket endpoint WS /ws/transcribe for real-time audio streaming
  - Protocol bridge converting frontend JSON frames to vLLM Realtime API events
  - Vite WebSocket proxy for /ws connections
affects: 04-02, 04-03, frontend WebSocket client implementation

# Tech tracking
tech-stack:
  added: [websockets (Python client for vLLM WebSocket)]
  patterns: [Bidirectional WebSocket proxy, async task fork pattern for WS bridge]

key-files:
  created:
    - backend/app/routers/streaming.py
    - backend/tests/test_streaming.py
    - backend/pytest.ini
  modified:
    - backend/app/main.py
    - backend/requirements.txt
    - frontend/vite.config.ts

key-decisions:
  - "Used websockets.legacy.client.connect to avoid websockets 16.0 API breaking changes"
  - "Two-task async fork pattern: frontend_to_vllm and vllm_to_frontend running concurrently"
  - "Frame type validation (WHITELIST: audio, start, stop) as threat T-04-02 mitigation"
  - "stop event with done callback for clean task cancellation on disconnect (T-04-05)"

requirements-completed: [RT-02]

# Metrics
duration: 5min
completed: 2026-05-05
---

# Phase 4 Plan 01: WebSocket Streaming Router Summary

**Backend WebSocket endpoint WS /ws/transcribe bridging frontend JSON frames to vLLM Realtime API via protocol conversion, with Vite dev proxy for WebSocket connections**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-05T14:06:11Z
- **Completed:** 2026-05-05T14:11:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- WebSocket endpoint at `/ws/transcribe` accepting connections and establishing vLLM bridge
- Full bidirectional protocol conversion between frontend JSON frames and vLLM Realtime API events
- Frontend-to-vLLM: audio→append, start→commit(false), stop→commit(true)
- vLLM-to-frontend: session.created→connected, transcription.delta→partial, transcription.done→final, error→error
- Vite dev server WebSocket proxy forwarding `/ws` to backend
- 8 streaming tests covering all protocol bridge directions (25 total backend tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create backend WebSocket router with vLLM protocol bridge** - `e2be38e` (feat)
   - streaming.py, test_streaming.py, pytest.ini, requirements.txt
2. **Task 2: Register streaming router + add Vite WS proxy** - `3004f6a` (feat)
   - main.py, vite.config.ts

## Files Created/Modified
- `backend/app/routers/streaming.py` — WebSocket endpoint with bidirectional protocol bridge to vLLM
- `backend/tests/test_streaming.py` — 8 tests covering all frame conversion directions
- `backend/pytest.ini` — pytest-asyncio auto mode config
- `backend/app/main.py` — Added streaming router import and registration
- `backend/requirements.txt` — Added websockets dependency
- `frontend/vite.config.ts` — Added `/ws` WebSocket proxy with `ws: true`

## Decisions Made
- Used `websockets.legacy.client.connect` instead of new websockets 16.0 API to avoid incompatibility
- Two-task async fork pattern (`frontend_to_vllm` + `vllm_to_frontend`) for concurrent bidirectional streaming
- Frame type whitelist validation (`VALID_TYPES = {"audio", "start", "stop"}`) per threat T-04-02 — rejects unknown frame types
- Done callback + stop event pattern for clean task cancellation on disconnect per threat T-04-05

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created pytest.ini for async test support**
- **Found during:** Task 1 (test execution)
- **Issue:** pytest-asyncio in strict mode requires explicit `asyncio_mode = "auto"` config
- **Fix:** Added `backend/pytest.ini` with `[tool.pytest.ini_options] asyncio_mode = "auto"`
- **Files modified:** backend/pytest.ini
- **Verification:** All 25 backend tests pass
- **Committed in:** e2be38e (Task 1 commit)

**2. [Rule 3 - Blocking] Used websockets.legacy API instead of default**
- **Found during:** Task 1 (implementation)
- **Issue:** websockets 16.0 deprecated `websockets.client.connect`, LSP shows import error
- **Fix:** Used `from websockets.legacy.client import connect` which works without deprecation at call site
- **Files modified:** backend/app/routers/streaming.py
- **Verification:** Import resolves, tests pass, no runtime errors
- **Committed in:** e2be38e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both blocking infrastructure)
**Impact on plan:** Both necessary for correct test execution and runtime compatibility. No scope creep.

## Issues Encountered
- Initial test design used async methods with TestClient, causing hangs. Resolved by rewriting tests with synchronous methods and proper mock vLLM responses including session.created before any data events.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend WebSocket endpoint ready for frontend client integration (04-02)
- Vite WS proxy configured for local development
- Protocol bridge tested with all 7 conversion directions
- vLLM WebSocket connection happens at runtime (requires vLLM server running)

## Self-Check: PASSED
- `backend/app/routers/streaming.py` exists on disk: FOUND
- `backend/tests/test_streaming.py` exists on disk: FOUND
- Git log contains 04-01 commits: FOUND (1cab0b6, e2be38e, 3004f6a)
- All 25 backend tests pass: PASS
- TypeScript compilation: PASS (0 errors)

---
*Phase: 04-real-time-streaming*
*Completed: 2026-05-05*
