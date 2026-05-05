---
phase: 3
slug: file-upload-transcription
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-05
---

# Phase 3 — Validation Strategy

> Per-phase validation contract: Nyquist audit with gap analysis and automated verification.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend Framework** | Vitest 3.x + jsdom + @testing-library/react |
| **Frontend Config** | `frontend/vite.config.ts` (vite.config includes test config) |
| **Frontend Quick run** | `cd frontend && npx vitest run` |
| **Frontend Full suite** | `cd frontend && npx vitest run --reporter=verbose` |
| **Frontend Estimated runtime** | ~20 seconds |
| **Backend Framework** | pytest 9.0.3 + pytest-asyncio 1.3.0 |
| **Backend Quick run** | `cd backend && python -m pytest tests/ -v` |
| **Backend Full suite** | `cd backend && python -m pytest tests/test_transcribe.py -v` |
| **Backend Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run`
- **After every plan wave:** Run `cd frontend && npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~25 seconds (frontend + backend combined)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 03-01 | 1 | FILE-01 | T-03-01 | Extension whitelist validation blocks spoofing | unit | `npx vitest run --reporter=verbose` | ✅ | ✅ |
| 03-01-02 | 03-01 | 1 | FILE-01 | T-03-02 | File size limit prevents oversized uploads | unit | `npx vitest run --reporter=verbose` | ✅ | ✅ |
| 03-01-03 | 03-01 | 1 | FILE-02 | T-03-05 | Sequential queue prevents DoS via parallel processing | unit | `npx vitest run --reporter=verbose` | ✅ | ✅ |
| 03-02-01 | 03-02 | 1 | FILE-01 | T-03-06 | Accept attribute restricts file types | unit | `npx vitest run --reporter=verbose` | ✅ NQ | ✅ |
| 03-02-02 | 03-02 | 1 | FILE-02 | T-03-05 | Progress bars show upload status | unit | `npx vitest run --reporter=verbose` | ✅ NQ | ✅ |
| 03-02-03 | 03-02 | 1 | FILE-03+04+05 | T-03-07 | Clipboard API requires user gesture | unit | `npx vitest run --reporter=verbose` | ✅ NQ | ✅ |
| 03-02-04 | 03-02 | 1 | FILE-03+04 | T-03-08 | Result card composes with useTranscribeQueue | integration | `npx vitest run --reporter=verbose` | ✅ PRE | ✅ |
| 03-03-01 | 03-03 | 2 | FILE-01 | — | Component wired correctly into app | compilation | `npx tsc --noEmit` | ✅ PRE | ✅ |
| 03-04-01 | 03-04 | 1 | FILE-02 | T-03-05 | jobsRef prevents stale closure DoS | unit | `npx vitest run --reporter=verbose` | ✅ NQ | ✅ |
| 03-04-02 | 03-04 | 1 | FILE-03 | T-03-10 | parse_model_output handles model output safely | unit | `python -m pytest tests/test_transcribe.py -v` | ✅ NQ | ✅ |

*Status: ✅ green · ❌ red · ⚠️ flaky*
*Legend: NQ = Nyquist-generated test, PRE = pre-existing test*

---

## Gap Analysis Summary

| Gap ID | Requirement | Component | Status | Evidence |
|--------|-------------|-----------|--------|----------|
| GAP-03-01 | FILE-01 | FileUploadZone | COVERED | 13 tests: drag-drop, input change, click trigger, disabled state, keyboard accessibility, accept attributes |
| GAP-03-02 | FILE-02 | TranscribeQueue | COVERED | 16 tests: empty state, all status labels, progress bar colors (blue/green/red), percentage display, multiple jobs |
| GAP-03-03 | FILE-03+04+05 | ResultCard | COVERED | 22 tests: filename, language badge, transcription text, token stats, duration formatting, no speech placeholder, clipboard copy, remove button, failed state, Chinese language |
| GAP-03-04 | FILE-03 | parse_model_output (backend) | COVERED | 17 tests: structured tags, natural prefix, fallback, Chinese/Japanese/Spanish/French detection, 2-letter codes, multiline, whitespace handling |

---

## Frontend Test Coverage by Requirement

| Requirement | Description | Test Files | Tests | Status |
|-------------|-------------|------------|-------|--------|
| FILE-01 | Upload audio files with format validation | transcribe.test.ts (12), transcribe.test.ts (12), FileUploadZone.test.tsx (13), useTranscribeQueue.test.tsx (4) | 41 | ✅ COVERED |
| FILE-02 | See upload progress and processing status | useTranscribeQueue.test.tsx (6), TranscribeQueue.test.tsx (16) | 22 | ✅ COVERED |
| FILE-03 | Transcription text with detected language | ResultCard.test.tsx (9), test_transcribe.py (17) | 26 | ✅ COVERED |
| FILE-04 | Copy transcription to clipboard | ResultCard.test.tsx (4) | 4 | ✅ COVERED |
| FILE-05 | Token usage stats | ResultCard.test.tsx (3) | 3 | ✅ COVERED |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full upload-to-result pipeline | FILE-01+02+03 | Requires running backend + real audio file | Navigate to File Upload tab, drop a WAV file, observe progress bar animate, observe result card with transcription |
| Error handling for backend failure | FILE-02 | Requires controlled server-down scenario | Stop FastAPI backend, attempt upload, observe red error card with user-friendly message |

---

## Test Execution Results

| Suite | Tests | Passed | Failed | Duration |
|-------|-------|--------|--------|----------|
| Frontend (Vitest) | 111 | 111 | 0 | ~20s |
| Backend (pytest) | 17 | 17 | 0 | ~1s |
| **Totals** | **128** | **128** | **0** | ~21s |

### Files Added During Nyquist Audit
- `frontend/src/components/fileupload/FileUploadZone.test.tsx` — 13 tests (GAP-03-01)
- `frontend/src/components/fileupload/TranscribeQueue.test.tsx` — 16 tests (GAP-03-02)
- `frontend/src/components/fileupload/ResultCard.test.tsx` — 22 tests (GAP-03-03)
- `backend/tests/test_transcribe.py` — 17 tests (GAP-03-04)

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (4 gaps filled)
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-05
