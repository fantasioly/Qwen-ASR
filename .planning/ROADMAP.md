# Roadmap: Qwen3-ASR Web Demo Suite

**Defined:** 2025-05-05
**Granularity:** Standard (5 phases)

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Backend Foundation | FastAPI server with vLLM proxy, health endpoint, API config | CONN-01, UI-02 | ✓ |
| 2 | Frontend + Connection Test | React UI with dashboard, connection test panel, settings | CONN-01 to CONN-04, UI-01 to UI-04 | 2/2 |
| 3 | File Upload Transcription | Upload audio files and get transcription results | FILE-01 to FILE-05 | 0/3 |
| 4 | Real-Time Streaming | Microphone audio capture with WebSocket streaming | RT-01 to RT-06 | 6 |
| 5 | Cache & Polish | Prompt caching visualization, error handling, production readiness | CACHE-01 to CACHE-03 | 3 |

**Total:** 5 phases | 22 requirements mapped | 100% coverage

---

## Phase 1: Backend Foundation

**Goal:** Establish FastAPI backend server that proxies requests to vLLM, provides health check, and supports configurable API settings.

**Requirements:** CONN-01, UI-02

**Plans:** 2 plans

**Success Criteria:**
1. FastAPI server starts and serves on configurable port (default 8000)
2. GET /api/health returns model info from vLLM `/v1/models` endpoint
3. API configuration (base URL, API key) is stored and used for all requests
4. POST /api/transcribe accepts audio file and returns transcription from vLLM
5. CORS configured to allow frontend origin

**UI hint:** no

**Plan list:**
- [x] 01-01-PLAN.md — Project scaffold + config + settings endpoint + error handling
- [x] 01-02-PLAN.md — Health endpoint + transcribe endpoint + router wiring

---

## Phase 2: Frontend + Connection Test

**Goal:** React frontend with dashboard layout, connection test panel, and configurable settings.

**Requirements:** CONN-01 to CONN-04, UI-01 to UI-04

**Plans:** 2 plans

**Success Criteria:**
1. User opens the app and sees a clean dashboard with feature sections
2. Connection test panel shows live status (green/red) with model info
3. User can measure API latency and see round-trip time
4. Settings panel allows changing API base URL and API key
5. Interface is responsive on desktop browser (tested at 1920x1080 and 1366x768)
6. Error messages display actionable guidance (e.g., "Check API URL and network")

**UI hint:** yes

**Plan list:**
- [x] 02-01-PLAN.md — Frontend scaffold + tab layout + settings panel
- [x] 02-02-PLAN.md — Connection test panel + health status + latency display

---

## Phase 3: File Upload Transcription

**Goal:** File upload flow with progress indication and transcription result display.

**Requirements:** FILE-01 to FILE-05

**Plans:** 3 plans

**Success Criteria:**
1. User can select and upload audio files (WAV, MP3, MP4, M4A, OGG, FLAC, WEBM)
2. Upload shows progress bar and processing status (uploading → processing → complete)
3. Result displays transcription text and detected language label
4. User can copy result to clipboard with one click
5. Token usage stats (prompt/completion tokens, total time) are displayed
6. Large file upload handles timeout gracefully with user-friendly message

**UI hint:** yes

**Plan list:**
- [ ] 03-01-PLAN.md — Transcribe types, XHR API client with progress, useTranscribeQueue hook
- [ ] 03-02-PLAN.md — FileUploadZone, TranscribeQueue, ResultCard, FileUploadPanel components
- [ ] 03-03-PLAN.md — Wire FileUploadPanel into App.tsx for fileupload tab

---

## Phase 4: Real-Time Streaming

**Goal:** Microphone audio capture with WebSocket streaming and incremental transcription display.

**Requirements:** RT-01 to RT-06

**Success Criteria:**
1. User can click "Start Recording" and see microphone permission prompt
2. Audio is captured, resampled to 16kHz, and streamed to backend via WebSocket
3. Transcription text updates incrementally as user speaks
4. Detected language is displayed during streaming session
5. WebSocket disconnect shows visual indicator and auto-reconnects
6. After stopping recording, final complete transcription is displayed

**UI hint:** yes

---

## Phase 5: Cache & Polish

**Goal:** Prompt caching visualization, performance comparison, error handling polish, and production readiness.

**Requirements:** CACHE-01 to CACHE-03

**Success Criteria:**
1. Request results show cache hit/miss indicator
2. User can run a comparison test showing latency with/without prefix cache
3. All error states have user-friendly messages with actionable guidance
4. UI has consistent styling across all panels
5. App handles all edge cases gracefully (network errors, invalid audio, etc.)

**UI hint:** yes
