---
phase: 05-cache-polish
plan: 06
subsystem: fix
tags: [python, typescript, websocket, react, fix]

requires:
  - phase: 05-01
    provides: "cache_read_tokens in TranscribeResponse and TranscribeUsage types"
  - phase: 05-02
    provides: "RealTimePanel cache badge, FileUploadPanel with removeJob"

provides:
  - "partialUsage fallback for cache stats when final transcription fails"
  - "onRemove prop on TranscribeQueue for removing queued jobs"

affects: [streaming, cache, queue]

tech-stack:
  added: []
  patterns: ["Display usage fallback pattern (finalUsage ?? partialUsage)"]

key-files:
  created: []
  modified: ["backend/app/routers/streaming.py", "frontend/src/api/streaming.ts", "frontend/src/hooks/useStreamingTranscribe.ts", "frontend/src/components/realtime/RealTimePanel.tsx", "frontend/src/components/fileupload/TranscribeQueue.tsx", "frontend/src/components/fileupload/FileUploadPanel.tsx"]

key-decisions:
  - "partialUsage fills cache stats gap when final transcription times out or fails"

requirements-completed: []

---

# Phase 5 Plan 6: Gap Closure - Cache Stats Fallback + Queue Remove Button

**Two UAT issues fixed: real-time panel cache stats fallback when final transcription fails, and remove button for queued jobs in TranscribeQueue**

## Performance

- **Duration:** 10 min
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Backend: `streaming.py` now includes usage data in periodic partial WebSocket frames (was discarded with `_`)
- Frontend: `streaming.ts` threads usage through `onPartial` callback
- Frontend: `useStreamingTranscribe.ts` tracks `partialUsage` state as fallback when finalUsage is null
- Frontend: `RealTimePanel.tsx` derives `displayUsage = finalUsage ?? partialUsage` for cache badge and stats row
- Frontend: `TranscribeQueue.tsx` accepts `onRemove` prop and renders X button for queued jobs
- Frontend: `FileUploadPanel.tsx` wires `removeJob` to TranscribeQueue via `handleQueueRemove` with index conversion

## Task Commits

1. **Task 1: Propagate usage in partial frames + UI fallback** - `7e8d75d` (fix)
2. **Task 2: Add remove button for queued jobs** - `2607558` (fix)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] TypeScript compilation passes (`tsc --noEmit` clean)
- [x] Partial frames now include usage field when available
- [x] RealTimePanel uses displayUsage fallback for cache badge and stats row
- [x] TranscribeQueue renders X button for queued jobs when onRemove is provided
- [x] FileUploadPanel wires removeJob to TranscribeQueue with correct index conversion

## Self-Check: PASSED

---
*Phase: 05-cache-polish*
*Completed: 2026-05-06*
