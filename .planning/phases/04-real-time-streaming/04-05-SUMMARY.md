---
phase: 04-real-time-streaming
plan: 05
subsystem: frontend
tags: [bugfix, uat-gap-closure, audio-ux, streaming-text]
dependency_graph:
  requires: []
  provides: [segment-index-color-logic, partial-text-replacement]
  affects: []
tech_stack:
  added: []
  patterns: [segment-index-aware-color, full-buffer-replacement]
key_files:
  created: []
  modified:
    - frontend/src/components/realtime/AudioMeter.tsx
    - frontend/src/hooks/useStreamingTranscribe.ts
decisions:
  - "Lower meter segments (0-2) always green — they signal threshold crossing, not volume intensity"
  - "Peak segment (index 3) carries volume-reactive color — green (<=0.3), yellow (<=0.7), red (>0.7)"
  - "Partial text replaces on each backend update — backend sends full re-transcription, not deltas"
metrics:
  duration: 5 minutes
  completed_date: 2026-05-06
---

# Phase 4 Plan 05: UAT Gap Closure — Audio Meter Color & Text Duplication Fix

**One-liner:** Segment-index-aware audio meter coloring and partial-text replacement (no append) eliminating two UAT failures.

## Completed Tasks

### Task 1: Fix AudioMeter — segment-index-aware color logic

**File:** `frontend/src/components/realtime/AudioMeter.tsx`

**Fix:** `getSegmentColor()` now checks segment index before audioLevel. Segments 0-2 (threshold-triggered) always return `bg-emerald-500` when filled. Segment 3 (peak, rendered outside the map) uses audioLevel thresholds: `<=0.3` green, `<=0.7` yellow, `>0.7` red.

**Commit:** `d5c0207`

### Task 2: Fix streaming text duplication — replace instead of append partial text

**File:** `frontend/src/hooks/useStreamingTranscribe.ts`

**Fix:** Changed `onPartial` callback from `setPartialText((prev) => prev + text)` to `setPartialText(text)`. Backend `periodic_transcription()` sends full-buffer re-transcription every 3 seconds — it's a complete transcription, not a delta. Replacing eliminates the "text keeps repeating" accumulation bug.

**Commit:** `4f4fd9d`

## Verification

- [x] `npx tsc --noEmit` — zero TypeScript errors
- [x] Audio meter: first 3 segments always green when lit; 4th (peak) color-reactive to volume
- [x] Streaming text: partial text replaces cleanly, no duplication

## Deviations from Plan

None — plan executed exactly as written.

## Auth Gates

None encountered.

## Known Stubs

None — both fixes are complete behavioral changes, no stubs introduced.

## Threat Flags

None — these are pure frontend logic fixes with no new surface.
