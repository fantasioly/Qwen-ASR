# Milestone v1.0 — Project Summary

**Generated:** 2026-05-06
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

**What This Is:** A web-based testing and demonstration suite for the Qwen3-ASR-1.7B speech-to-text model deployed via vLLM. Provides real-time audio transcription, file upload transcription, connection testing, cache visualization, and error handling through a modern React frontend with FastAPI backend.

**Core Value:** Users can verify the Qwen3-ASR model works correctly through an intuitive web interface — testing connectivity, transcribing live audio in real-time, processing uploaded audio files, and validating model capabilities including cache performance.

**Target Users:** Developers and QA engineers who need to verify model functionality, test transcription quality, and demonstrate capabilities to stakeholders.

**Usage Scenarios:**
1. Quick connectivity check before deployment changes
2. Live audio transcription demos for stakeholders
3. Batch testing of audio files for quality assessment
4. Latency and performance benchmarking
5. Cache performance comparison (prefix caching demonstration)

**Deployed Model:**
- Qwen3-ASR-1.7B (from ModelScope)
- Framework: vLLM
- API Endpoint: http://10.50.193.74:30003
- API Format: OpenAI-compatible REST + WebSocket

---

## 2. Architecture & Technical Decisions

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS v4 |
| Backend | FastAPI + Python + OpenAI SDK |
| Audio Processing | Web Audio API (browser-side resampling to 16kHz mono PCM) |
| Real-time Protocol | WebSocket + JSON frames (with HTTP periodic fallback) |

### Key Architecture Decisions

- **D-01/D-02:** Pydantic Settings for type-safe config, `.env` file + runtime updates via `PUT /api/settings` — no server restart needed (Phase 1)
- **D-04:** OpenAI Python SDK for vLLM integration (single dependency, ecosystem standard) — Phase 1
- **D-05:** Minimal audio preprocessing — backend forwards audio as-is to vLLM (Phase 1)
- **D-07:** Health endpoint calls vLLM `/v1/models`, returns `{status, model, latency_ms}` (Phase 1)
- **D-08:** Structured JSON error responses: `{error, message, code}` (Phase 1)
- **D-10:** Tab navigation — Connection Test, File Upload, Real-Time, Settings (Phase 2)
- **D-12:** Large visual health indicator — green/red dot + model name + latency always visible (Phase 2)
- **D-18/D-19:** Toggle record button + audio level meter + pulsing indicator (Phase 4)
- **D-21:** Backend WebSocket endpoint `WS /ws/transcribe` → JSON frames protocol (Phase 4)
- **D-26:** Final result card format matches File Upload ResultCard — cross-tab consistency (Phase 4)
- **D-27:** Auto-reconnect with exponential backoff (1s, 2s, 4s) — 3 attempts max (Phase 4)
- **D-30:** Browser-side resampling with Web Audio API (AudioContext + ScriptProcessorNode) (Phase 4)
- **D-32/D-33:** Cache badge on ResultCard header — green badge with count (hit), gray dash (miss) (Phase 5)
- **D-35:** "⚡ Compare" button — re-uploads file for cache hit comparison with latency delta (Phase 5)
- **D-37/D-39:** Inline retry button + centralized error message map (`errorMap.ts`) (Phase 5)

---

## 3. Phases Delivered

| # | Phase | Plans | One-Liner |
|---|-------|-------|-----------|
| 1 | Backend Foundation | 2/2 | FastAPI server with vLLM proxy, health check, configurable API settings |
| 2 | Frontend + Connection Test | 2/2 | React UI with dashboard tabs, connection test panel, and settings |
| 3 | File Upload Transcription | 4/4 | Drag-drop audio file upload with progress, language detection, and token stats |
| 4 | Real-Time Streaming | 5/5 | Microphone capture with WebSocket streaming and incremental transcription |
| 5 | Cache & Polish | 4/4 | Cache hit/miss visualization, latency comparison, error handling polish |

### Gap Closures

| Phase | Plans | What Was Fixed |
|-------|-------|---------------|
| 3 | 03-04 | Stale closure in `processQueue` + language parsing from model output |
| 4 | 04-04 | WebSocket bridge 403 → HTTP periodic streaming (3s interval) |
| 4 | 04-05 | Audio meter color fix + streaming text duplication fix |
| 5 | 05-06 | Cache stats fallback when final transcription fails + queue remove button |

---

## 4. Requirements Coverage

All 22 v1 requirements validated through UAT testing.

| Group | Total | Status |
|-------|-------|--------|
| Connection Test (CONN-01 to CONN-04) | 4 | ✅ Complete |
| File Upload Transcription (FILE-01 to FILE-05) | 5 | ✅ Complete |
| Real-Time Transcription (RT-01 to RT-06) | 6 | ✅ Complete |
| Prompt Caching (CACHE-01 to CACHE-03) | 3 | ✅ Complete |
| UI/UX (UI-01 to UI-04) | 4 | ✅ Complete |
| **Total** | **22** | **✅ All Complete** |

---

## 5. Key Decisions Log

| ID | Decision | Phase | Outcome |
|----|----------|-------|---------|
| D-01 | Pydantic Settings + .env config | 1 | ✓ Good — type-safe, runtime updatable |
| D-04 | OpenAI SDK for vLLM calls | 1 | ✓ Good — single dependency |
| D-07 | Health via vLLM /v1/models | 1 | ✓ Good — single round-trip |
| D-08 | Structured JSON errors | 1 | ✓ Good — consistent across all endpoints |
| D-10 | Tab navigation | 2 | ✓ Good — clean separation |
| D-12 | Visual health indicator | 2 | ✓ Good — always visible |
| D-18 | Toggle record button | 4 | ✓ Good — clear state |
| D-21 | WebSocket JSON frames | 4 | ✓ Good — debuggable, proxy-friendly |
| D-27 | Auto-reconnect (3 attempts) | 4 | ✓ Good — resilient |
| D-30 | Browser-side 16kHz resampling | 4 | ✓ Good — no server overhead |
| D-32 | Cache badge on ResultCard | 5 | ✓ Good — visible at a glance |
| D-35 | Compare button for cache demo | 5 | ✓ Good — useful benchmark |
| D-39 | Centralized error map | 5 | ✓ Good — consistent UX |

---

## 6. Tech Debt & Deferred Items

### Known Technical Debt

- **Backend Pylance type errors** — `transcribe.py` and `streaming.py` have type errors with OpenAI SDK types (`ChatCompletionMessageParam`, `cache_read_tokens`). These are cosmetic (pre-existing in SDK) and don't affect runtime.
- **HTTP periodic transcription** — WebSocket bridge to vLLM returned 403, so we pivoted to HTTP periodic transcription with 3s interval. Works well for demo, but true WebSocket streaming would be more efficient for production.
- **ScriptProcessorNode deprecated** — Uses `ScriptProcessorNode` for audio capture (simpler). Should migrate to `AudioWorklet` for production-grade audio processing.

### Deferred for v1.1+

- Batch upload comparison (v2 requirement TEST-01)
- Latency benchmarking with statistical summary (TEST-02)
- Test result export as Markdown/PDF (TEST-03)
- Audio waveform visualization (VIS-01)

---

## 7. Getting Started

### Prerequisites

- Python 3.12+ and Node.js 20+
- vLLM server running Qwen3-ASR-1.7B (internal: `http://10.50.193.74:30003`)

### Run the Project

```bash
# Backend
cd backend
pip install -r requirements.txt
# Edit backend/.env with your API settings
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Key Directories

```
backend/app/
├── main.py              # FastAPI app factory with CORS + router registration
├── config.py            # Pydantic Settings (AppSettings)
├── errors.py            # Structured error response helpers
└── routers/
    ├── health.py        # GET /api/health → vLLM connectivity check
    ├── settings.py      # GET/PUT /api/settings → runtime config
    ├── transcribe.py    # POST /api/transcribe → audio transcription
    └── streaming.py     # WS /ws/transcribe → real-time streaming

frontend/src/
├── api/                 # API clients (transcribe, streaming)
├── components/
│   ├── connectiontest/  # Connection test panel
│   ├── fileupload/      # File upload zone, queue, result cards
│   ├── realtime/        # Real-time recording panel
│   └── settings/        # Settings panel
├── hooks/
│   ├── useTranscribeQueue.ts  # Queue management for file uploads
│   └── useStreamingTranscribe.ts  # WebSocket streaming + audio capture
├── types/transcribe.ts   # Shared type definitions
└── lib/errorMap.ts       # Centralized error message mapping
```

### Tests

```bash
cd frontend && npm run test
cd backend && pytest
```

### Where to Look First

1. **`backend/app/main.py`** — FastAPI app entry point, CORS config, router registration
2. **`frontend/src/App.tsx`** — Frontend entry point with tab navigation
3. **`backend/.env`** — API configuration (base URL, key, timeout)
4. **`frontend/src/api/`** — All API calls live here (good place to understand data flow)

---

## Stats

| Metric | Value |
|--------|-------|
| **Timeline** | 2026-05-05 → 2026-05-06 (1 day) |
| **Phases** | 5 / 5 complete |
| **Plans** | 17 total (13 original + 4 gap closures) |
| **Commits** | 111 |
| **Files Changed** | 160 (+19,656 / -16) |
| **Contributors** | Haoli |
| **Requirements** | 22 / 22 validated |
| **UAT Tests** | Phase 4: all pass | Phase 5: all pass (2 fixes verified) |

---

## Lessons Learned

- **Gap closures are normal** — 4 gap closure plans (23% of total plans) were needed. WebSocket bridge 403 was the biggest surprise, requiring a full rearchitecture of the streaming approach.
- **UAT catches real issues** — cold-start smoke test, stale closure bug, and missing queue remove button were all caught through user testing.
- **HTTP fallback works well** — periodic HTTP transcription with 3s interval provides a good "real-time enough" experience despite WebSocket bridge failure.
- **Centralized error patterns** — `errorMap.ts` proved valuable for consistent error UX across all panels.
