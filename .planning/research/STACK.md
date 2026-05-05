# Stack Research: Qwen3-ASR Web Demo Suite

## Frontend

| Component | Recommendation | Version | Confidence |
|-----------|----------------|---------|------------|
| Framework | React 19 | 19.x | High |
| Language | TypeScript | 5.x | High |
| Build Tool | Vite | 6.x | High |
| UI Framework | Ant Design or TailwindCSS | Latest | Medium |
| Audio Recording | MediaRecorder API (native) | N/A | High |
| Audio Processing | WASM-based resampler (16kHz) | N/A | High |
| WebSocket Client | Native WebSocket API | N/A | High |
| HTTP Client | Axios or native fetch | Latest | Medium |

**Rationale:** React + Vite provides fast HMR, good TypeScript support, and minimal configuration. MediaRecorder API is native and well-supported for browser audio capture.

## Backend

| Component | Recommendation | Version | Confidence |
|-----------|----------------|---------|------------|
| Framework | FastAPI | 0.115.x | High |
| Python Version | 3.12 | 3.12 | High |
| OpenAI Client | openai Python SDK | 1.x | High |
| WebSocket | FastAPI WebSocket (native) | N/A | High |
| Audio Processing | pydub or soundfile | Latest | High |
| Streaming | fastapi WebSocket + SSE | Latest | High |

**Rationale:** FastAPI provides native WebSocket support, async I/O, and automatic OpenAPI docs. The `openai` Python SDK works directly with vLLM's OpenAI-compatible API.

## API Integration

| Endpoint | vLLM Route | Method | Purpose |
|----------|-----------|--------|---------|
| Chat Completions | /v1/chat/completions | POST | File-based transcription via audio_url |
| Transcriptions | /v1/audio/transcriptions | POST | File upload transcription |
| Realtime | /v1/realtime | WebSocket | Real-time streaming transcription |
| Models | /v1/models | GET | Model listing and availability |

**Key Integration Notes:**
- vLLM serves Qwen3-ASR via OpenAI-compatible API at the configured port
- Audio inputs via chat completions use `audio_url` content type (base64 or URL)
- Transcriptions API supports file upload with multipart/form-data
- Realtime API uses WebSocket for bidirectional audio streaming
- Prompt caching is automatic with vLLM's prefix caching (enabled by default)

## What NOT to Use

| Technology | Reason |
|------------|--------|
| Node.js backend | OpenAI Python SDK and audio processing libraries are Python-native |
| WebRTC for streaming | vLLM Realtime API uses standard WebSocket, not WebRTC |
| Gradio | Official demo uses Gradio, but we need custom UI for testing suite |
| Server-sent events (SSE) for audio | vLLM Realtime API requires WebSocket for bidirectional streaming |

---
*Research completed: 2025-05-05*
