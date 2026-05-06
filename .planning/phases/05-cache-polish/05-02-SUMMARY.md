---
phase: 05-cache-polish
plan: 2
subsystem: ui
tags: [react, cache-ui, comparison, tailwind]

requires:
  - phase: 05-01
    provides: "cache_read_tokens in TranscribeResponse and TranscribeUsage types"
  - phase: 05-03
    provides: "ResultCard with onRetry prop, FileUploadPanel with error handling"
provides:
  - "Cache hit/miss badge on ResultCard (green with count, gray dash)"
  - "Compare button with re-upload flow and comparison display"
  - "Cache indicator on RealTimePanel final result card"
affects: [cache UX, performance demo]

tech-stack:
  added: []
  patterns: ["Cache badge inline in ResultCard header (D-32), compare re-upload flow (D-35), stacked comparison with delta badge (D-36)"]

key-files:
  created: []
  modified: ["frontend/src/components/fileupload/ResultCard.tsx", "frontend/src/components/fileupload/FileUploadPanel.tsx", "frontend/src/components/realtime/RealTimePanel.tsx", "frontend/src/types/transcribe.ts", "frontend/src/hooks/useStreamingTranscribe.ts", "frontend/src/hooks/useTranscribeQueue.ts"]

key-decisions:
  - "Compare re-uploads file directly via uploadAudio (bypassing queue) for immediate comparison"
  - "Comparison result stored on original TranscribeJob, not as separate card"

requirements-completed: [CACHE-01, CACHE-02, CACHE-03]
---

# Phase 5 Plan 2: Cache Badge UI + Compare Tool Summary

**Cache hit/miss indicators on ResultCard and RealTimePanel with Compare button for prefix caching demonstration**

## Performance

- **Duration:** 12 min
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- ResultCard shows green cache badge with token count for hits (cache_read_tokens > 0), gray dash for misses
- Compare button with Zap icon triggers re-upload, shows side-by-side comparison with latency delta percentage
- RealTimePanel final result card shows matching cache badge and cache tokens in stats

## Task Commits

1. **Task 1: ResultCard cache badge + compare** - `44ccbcb` (feat)
2. **Task 2: FileUploadPanel compare flow** - `6f1091d` (feat)
3. **Task 3: RealTimePanel cache indicator** - `61b9de6` (feat)

## Files Modified
- `frontend/src/components/fileupload/ResultCard.tsx` - Cache badge, compare button, comparison display
- `frontend/src/components/fileupload/FileUploadPanel.tsx` - handleCompare callback, comparison state, ResultCard wiring
- `frontend/src/components/realtime/RealTimePanel.tsx` - Cache badge in header, cache tokens in stats
- `frontend/src/types/transcribe.ts` - TranscribeJob with comparison and isComparing fields
- `frontend/src/hooks/useStreamingTranscribe.ts` - finalUsage includes cache_read_tokens
- `frontend/src/hooks/useTranscribeQueue.ts` - setJobs exposed for comparison state updates

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

All Wave 2 tasks complete. Phase 5 execution fully done.

---
*Phase: 05-cache-polish*
*Completed: 2026-05-06*
