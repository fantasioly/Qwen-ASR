---
phase: 03-file-upload-transcription
plan: 04
type: gap_closure
status: complete
completed: "2026-05-05T16:45:00Z"
---

## Plan 03-04: Gap Closure Summary

**Goal:** Close 2 UAT-diagnosed gaps from Phase 3.

### Task 1: Fix stale closure bug in useTranscribeQueue [DONE]

**File:** `frontend/src/hooks/useTranscribeQueue.ts`

**Problem:** `processQueue()` closure captured a stale `jobs` array (empty) when called synchronously after `enqueue()`, because React hadn't flushed the state update yet.

**Fix:** Added `jobsRef` (useRef) synced via `useEffect([jobs])`. `processQueue` reads `jobsRef.current` instead of `jobs`. Removed `jobs` from useCallback deps — now only `[isProcessing]`.

**Changes:**
- Line 38: `const jobsRef = useRef<TranscribeJob[]>(jobs)`
- Line 47-49: `useEffect(() => { jobsRef.current = jobs }, [jobs])`
- Line 116: `let currentJobs = [...jobsRef.current]`
- Line 191: `}, [isProcessing])`

### Task 2: Parse language from model output [DONE]

**File:** `backend/app/routers/transcribe.py`

**Problem:** `language` was hardcoded to `"unknown"`. Model output contained language detection prefix (e.g., `language English<asr_text>...`) embedded in transcription text.

**Fix:** Added `parse_model_output()` with 3 parsing strategies:
1. Structured tags: `<language>XX</language><asr_text>...</asr_text>`
2. Natural prefix: `"language English<asr_text>..."`
3. Fallback: plain text with `language = "unknown"`

Updated `SYSTEM_PROMPT` to instruct model on output format. Added `LANGUAGE_MAP` (16→2-letter ISO codes) and `_resolve_language()` helper. Route handler calls `parse_model_output(raw_output)` and uses `detected_language` in response.

**Verification:**
- TypeScript: clean (0 errors)
- Vitest: 8 files, 59 tests passed
- parse_model_output: 6 test cases passed (structured, natural, fallback, Chinese, newline prefix)
