# Architecture Research: Qwen3-ASR Web Demo Suite

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Connection  │  │   Realtime  │  │   File Upload   │ │
│  │    Test      │  │Transcription│  │  Transcription   │ │
│  └──────┬───────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                 │                   │          │
│  ┌──────┴─────────────────┴───────────────────┴────────┐ │
│  │              Audio Manager (MediaRecorder)           │ │
│  │              WebSocket Client │ HTTP Client          │ │
│  └──────────────────┬──────────────────────────────────┘ │
└─────────────────────┼────────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │   CORS Proxy   │
              │   (if needed)  │
              └───────┬────────┘
                      │
        ┌─────────────┴─────────────┐
        │         FastAPI            │
        │  ┌──────────────────────┐  │
        │  │  WebSocket (SSE)     │  │
        │  │  /ws/transcribe      │  │
        │  └──────────────────────┘  │
        │  ┌──────────────────────┐  │
        │  │  HTTP Endpoints      │  │
        │  │  /api/health         │  │
        │  │  /api/transcribe     │  │
        │  │  /api/models         │  │
        │  └──────────────────────┘  │
        └─────────────┬──────────────┘
                      │
              ┌───────┴───────┐
              │   vLLM Server   │
              │  :30003         │
              │  Qwen3-ASR-1.7B │
              └─────────────────┘
```

## Data Flow

1. **Connection Test**: Frontend → FastAPI `/api/health` → OpenAI client → vLLM `/v1/models` → returns model info
2. **File Upload**: Frontend uploads file → FastAPI `/api/transcribe` → OpenAI `audio.transcriptions.create()` → vLLM → returns text
3. **Real-time Transcription**: Frontend captures audio → resamples to 16kHz WAV → FastAPI `/ws/transcribe` WebSocket → OpenAI Realtime API → vLLM streaming → incremental results

## Build Order Implications

1. **Phase 1: Backend foundation** — FastAPI server, OpenAI client setup, health endpoint
2. **Phase 2: Frontend foundation** — React app, UI layout, connection test UI
3. **Phase 3: File transcription** — File upload flow, result display
4. **Phase 4: Real-time streaming** — Audio capture, WebSocket, incremental display
5. **Phase 5: Enhancement** — Prompt caching visualization, benchmarking, polish

## Component Boundaries

| Component | Responsibility | Dependencies |
|-----------|----------------|--------------|
| Frontend App | UI, audio capture, WebSocket client | Vite, React, AudioContext |
| Audio Manager | Recording, resampling, encoding | Web Audio API |
| API Client | HTTP calls, OpenAI SDK wrapper | openai Python SDK |
| WebSocket Handler | Streaming audio to vLLM | FastAPI WebSocket |
| vLLM Server | Model inference (external) | Deployed separately |

---
*Research completed: 2025-05-05*
