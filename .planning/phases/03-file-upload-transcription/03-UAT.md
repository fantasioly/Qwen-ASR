---
status: testing
phase: 03-file-upload-transcription
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: "2026-05-05T06:15:00Z"
updated: "2026-05-05T06:26:00Z"
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start — App Bootstraps
expected: Kill any running dev server. Start fresh. Navigate to dev server URL. Dashboard loads without errors.
result: pass

### 2. File Upload Tab Accessible
expected: Navigate from dashboard to "File Upload" tab from the sidebar. Transcription page loads with upload zone visible.
result: pass

### 3. Upload Audio File via Click
expected: Click the upload zone to open file picker. Select a supported audio file (WAV/MP3/MP4/M4A/OGG/FLAC/WEBM). File appears in upload queue with name and size info.
result: pass

### 4. Drag and Drop Audio File
expected: Drag an audio file onto the upload zone. Drop zone highlights during drag. File appears in queue on drop.
result: pass

### 5. File Format Validation
expected: Attempt to upload an unsupported file type (e.g., .txt or .png). Upload is rejected with format validation error.
result: pass

### 6. Upload Progress Display
expected: During upload, progress bar shows percentage and animates upward. Status label shows "Uploading" then "Processing" then "Complete" with green color.
result: issue
reported: "上传完成后没有显示绿色，QUEUE下面自左向右显示的是文件名，一个灰色的空进度条，Waiting..."
severity: major

### 7. Transcription Result Display
expected: After processing, result card shows the transcribed text and detected language labeled correctly (e.g., "Chinese", "English").
result: issue
reported: "文件名后显示unknown，语言检测文本嵌入转译结果中如language English<asr_text>中文内容，且中文音频被检测为英文"
severity: major

### 8. Copy Transcription to Clipboard
expected: Click the copy button on a result card. Copy icon changes and toast confirmation appears.
result: pass

### 9. Token Usage Stats Visible
expected: Result card displays prompt tokens, completion tokens, and total processing time.
result: pass

### 10. Multiple File Queue Processing
expected: Upload multiple files in quick succession. Files process sequentially (FIFO). Each shows independent progress and result.
result: pass

## Summary

total: 10
passed: 8
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Upload shows progress bar and processing status (uploading → processing → complete)"
  status: failed
  reason: "User reported: 上传完成后没有显示绿色，QUEUE下面自左向右显示的是文件名，一个灰色的空进度条，Waiting..."
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Result displays transcription text and detected language label"
  status: failed
  reason: "User reported: 文件名后显示unknown，语言检测文本嵌入转译结果中如language English<asr_text>中文内容，且中文音频被检测为英文"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

## Issues Found

### Test 6: Progress Stuck After Upload
**Description:** 上传完成后没有显示绿色，QUEUE下面自左向右显示的是文件名，一个灰色的空进度条，Waiting...
**Severity:** major
**Expected:** Progress bar turns green on completion, status shows "Complete"

### Test 7: Language Detection Issues
**Description:** 文件名后显示unknown，语言检测文本嵌入转译结果中如language English<asr_text>中文内容，且中文音频被检测为英文
**Severity:** major
**Expected:** Language label shows detected language (not "unknown"), language detection text separated from transcription
