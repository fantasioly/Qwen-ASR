---
status: testing
phase: 05-cache-polish
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: '2026-05-06T06:00:00Z'
updated: '2026-05-06T06:00:00Z'
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
result: issue
reported: "没有显示cache数，是灰色的"—"
severity: major

### 5. Error Shows Friendly Message with Retry Button
expected: Trigger a transcription error (e.g., upload invalid file or simulate network error). The ResultCard shows a user-friendly error message (not raw error text) and a Retry button for retryable errors.
result: pass

### 6. Remove Job Actually Removes from Queue
expected: Click the remove/delete button on a job in the file upload panel. The job is removed from the queue and its ResultCard disappears from the UI.
result: issue
reported: "文件上传后没有remove按钮，只有点击Transcribe ALL后出现Clear Results按钮，且只清除结果，不能单独移除队列中的job"
severity: major

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Real-time panel final result card shows cache tokens in session stats"
  status: failed
  reason: "User reported: 没有显示cache数，是灰色的'——'"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []

- truth: "Click remove/delete on a job in the file upload panel removes it from queue and hides its ResultCard"
  status: failed
  reason: "User reported: 文件上传后没有remove按钮，只有点击Transcribe ALL后出现Clear Results按钮，且只清除结果，不能单独移除队列中的job"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
