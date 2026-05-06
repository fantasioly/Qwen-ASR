---
status: complete
phase: 05-cache-polish
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: '2026-05-06T06:00:00Z'
updated: '2026-05-06T06:15:00Z'
---

## Current Test

number: [complete]
name: [all tests done]
expected: |
  [testing complete]
awaiting: none

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state. Start the application from scratch. Backend boots without errors, frontend dev server starts, and the dashboard loads in the browser.
result: pass

### 2. Cache Badge on File Transcription Result
expected: Upload an audio file for transcription. After results appear, the ResultCard shows a cache badge: green badge with token count if cache was hit (cache_read_tokens > 0), or a gray dash if cache was missed.
result: pass

### 3. Compare Button Shows Latency Delta
expected: Click the Compare (Zap icon) button on a transcribed result. The file is re-uploaded and a second transcription runs. Results show side-by-side comparison with latency delta percentage badge between first and second attempt.
result: pass

### 4. Real-Time Panel Shows Cache Indicator
expected: Start a real-time recording session, speak, and stop. The final result card shows a cache badge (green with count or gray dash) and cache tokens appear in the session stats.
result: pass
issue_fixed: true
fix_plan: "05-06-PLAN.md"
regression_test: pass (2026-05-06)

### 5. Error Shows Friendly Message with Retry Button
expected: Trigger a transcription error (e.g., upload invalid file or simulate network error). The ResultCard shows a user-friendly error message (not raw error text) and a Retry button for retryable errors.
result: pass

### 6. Remove Job Actually Removes from Queue
expected: Click the remove/delete button on a job in the file upload panel. The job is removed from the queue and its ResultCard disappears from the UI.
result: pass (fix verified)
issue_fixed: true
fix_plan: "05-06-PLAN.md"

## Summary

total: 6
passed: 6
issues: 0 (2 issues fixed via 05-06-PLAN.md)
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Real-time panel final result card shows cache tokens in session stats"
  status: fixed
  reason: "User reported: 没有显示cache数，是灰色的'——'"
  severity: major
  test: 4
  root_cause: "finalUsage may be null (final transcription failed/timed out, only empty partial text remains) so the stats row with cache token count doesn't render. RealTimePanel.tsx:90-101 guards on finalUsage being truthy. Also periodic transcription (streaming.py:150) discards usage with underscore, so only the final frame carries usage data. If final frame is lost, no stats appear."
  artifacts:
    - path: "frontend/src/components/realtime/RealTimePanel.tsx"
      issue: "Stats row (line 90-101) only renders when finalUsage is truthy — if final transcription fails, no stats shown"
    - path: "backend/app/routers/streaming.py"
      issue: "Periodic transcription drops usage (line 150: clean_text, lang, _) — only final frame carries usage"
  missing:
    - "Include usage in periodic partial frames so stats are available even if final transcription fails"
    - "Fallback stats display when finalUsage is null but partial usage exists"
  fix_plan: "05-06-PLAN.md"
  fix_status: "completed"

- truth: "Click remove/delete on a job in the file upload panel removes it from queue and hides its ResultCard"
  status: fixed
  reason: "User reported: 文件上传后没有remove按钮，只有点击Transcribe ALL后出现Clear Results按钮，且只清除结果，不能单独移除队列中的job"
  severity: major
  test: 6
  root_cause: "TranscribeQueue component (TranscribeQueue.tsx) has no remove button — it only displays filename, progress bar, and status text. The removeJob function from useTranscribeQueue is wired in FileUploadPanel and passed to ResultCard (for completed jobs), but TranscribeQueue receives no onRemove prop to delete queued items."
  artifacts:
    - path: "frontend/src/components/fileupload/TranscribeQueue.tsx"
      issue: "No remove/X button on queued job rows — component only accepts jobs and isProcessing props"
    - path: "frontend/src/components/fileupload/FileUploadPanel.tsx"
      issue: "TranscribeQueue rendered at line 152 receives no remove callback — only activeJobs and isProcessing passed"
  missing:
    - "Add onRemove prop to TranscribeQueue component"
    - "Wire removeJob callback from FileUploadPanel to TranscribeQueue"
    - "Add X/remove button on each queued job row in TranscribeQueue"
  fix_plan: "05-06-PLAN.md"
  fix_status: "completed"
