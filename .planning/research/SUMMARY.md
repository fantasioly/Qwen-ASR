# Research Summary: Qwen3-ASR Web Demo Suite

## Stack Decisions

- **Frontend:** React 19 + TypeScript + Vite 6
- **Backend:** FastAPI (Python 3.12) + openai Python SDK
- **Audio:** MediaRecorder API (browser) + 16kHz PCM resampling
- **Streaming:** WebSocket (vLLM Realtime API)
- **API Pattern:** Backend proxies all requests to vLLM at `http://10.50.193.74:30003`

## vLLM API Surface

| API | Endpoint | Use Case |
|-----|----------|----------|
| Health/Models | GET /v1/models | Connection testing |
| Chat Completions | POST /v1/chat/completions | Audio URL transcription |
| Transcriptions | POST /v1/audio/transcriptions | File upload transcription |
| Realtime | WebSocket /v1/realtime | Real-time streaming |

**Key Finding:** vLLM provides full OpenAI-compatible API plus Realtime WebSocket API for streaming ASR. Prompt caching (prefix caching) is enabled by default.

## Critical Risks

1. **CORS:** Frontend cannot call vLLM directly — must proxy through FastAPI
2. **Audio Format:** Must resample to 16kHz mono PCM — model fails silently otherwise
3. **WebSocket Protocol:** vLLM Realtime API has specific JSON message format — must follow protocol exactly
4. **Output Parsing:** Use `qwen_asr.parse_asr_output()` to extract language + text from raw model output

## Build Order

1. Backend foundation (FastAPI + proxy + health check)
2. Frontend foundation (React + UI + connection test)
3. File upload transcription
4. Real-time WebSocket streaming
5. Prompt caching visualization and polish

## Table Stakes Features

- Connection test with model info and latency
- Real-time microphone transcription with WebSocket
- File upload transcription with progress
- Result copy/export
- Prompt caching status display
