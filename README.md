# Qwen3-ASR Web Demo Suite

Web-based testing and demonstration tool for the [Qwen3-ASR-1.7B](https://modelscope.cn/models) speech recognition model deployed via vLLM.

## Features

- **Connection Test** — Verify API endpoint, authentication, and model info
- **Real-time Transcription** — Live microphone capture with incremental text display
- **File Upload** — Transcribe audio files (WAV, MP3, MP4, M4A, OGG, FLAC, WEBM) with progress tracking
- **Prompt Caching** — Cache hit/miss badges and latency comparison tool
- **WebSocket Streaming** — Bidirectional audio streaming with auto-reconnect

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | FastAPI + OpenAI SDK + Uvicorn |
| Model | Qwen3-ASR-1.7B via vLLM (OpenAI-compatible API) |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- A running vLLM instance serving Qwen3-ASR-1.7B with OpenAI-compatible API

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your vLLM endpoint and API key

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Environment Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://<your-vllm-host>:<port>/v1` | vLLM API endpoint |
| `API_KEY` | `test` | API key for authentication |
| `PORT` | `8000` | Backend server port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `REQUEST_TIMEOUT` | `30` | Request timeout in seconds |
| `MODEL_NAME` | _(auto-detected)_ | Model name on vLLM |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry
│   │   ├── config.py         # Settings with pydantic-settings
│   │   ├── errors.py         # Error handling utilities
│   │   └── routers/          # API route handlers
│   │       ├── health.py     # Health check endpoint
│   │       ├── settings.py   # Settings endpoint
│   │       ├── transcribe.py # File upload transcription
│   │       └── streaming.py  # WebSocket/live streaming
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve with backend
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## License

MIT
