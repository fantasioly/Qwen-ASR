# Qwen3-ASR Web Demo Suite

## What This Is

A shipping web-based testing and demonstration suite for the Qwen3-ASR-1.7B speech-to-text model deployed via vLLM. Provides real-time audio transcription via WebSocket, file upload transcription with progress tracking, connection testing, latency benchmarking, and cache visualization through a modern React frontend with FastAPI backend.

## Core Value

Users can verify the Qwen3-ASR model works correctly through an intuitive web interface — testing connectivity, transcribing live audio in real-time, processing uploaded audio files, and validating model capabilities including cache performance.

## Requirements

### Validated

- ✓ Model connection test — verify API endpoint, authentication, and model info — v1.0
- ✓ Real-time audio transcription — microphone capture with incremental display — v1.0 (WebSocket + periodic HTTP fallback)
- ✓ File upload transcription — multi-format upload with progress and results — v1.0
- ✓ Prompt caching — cache hit/miss badges, latency comparison tool — v1.0
- ✓ WebSocket streaming — bidirectional audio streaming with auto-reconnect — v1.0
- ✓ Cache visualization — green/gray badges, token stats, compare tool — v1.0
- ✓ Error handling polish — user-friendly messages with inline retry — v1.0

### Active

- [ ] Batch upload comparison — upload multiple files and compare results side-by-side
- [ ] Latency benchmarking — run structured latency tests with statistical summary
- [ ] Test result export — save transcription results as structured Markdown/PDF report
- [ ] Audio waveform visualization — visual feedback for captured/uploaded audio

### Out of Scope

- Model training or fine-tuning — this is a demo/testing suite, not a training platform
- Multi-model comparison — focused on single Qwen3-ASR-1.7B model
- User accounts and authentication — internal demo, no user management needed
- Mobile app — web-only, desktop-first
- Batch processing at scale — single-file upload, not enterprise pipeline
- Real-time collaboration — not needed for testing use case
- Speech-to-text translation — model supports transcription only, not translation

## Context

**Deployed Model:**
- Model: Qwen3-ASR-1.7B (from ModelScope)
- Framework: vLLM
- API Endpoint: http://10.50.193.74:30003
- API Format: OpenAI-compatible REST + WebSocket
- API Key: test

**Shipped State (v1.0):**
- 5,469 LOC across React + TypeScript frontend and FastAPI Python backend
- 157 files, 17 plans, 109 commits
- Tech stack: React + TypeScript + Vite + Tailwind CSS v4 (frontend), FastAPI + OpenAI SDK (backend)
- All 22 v1 requirements validated through UAT
- Known gap: HTTP periodic transcription used as WebSocket bridge workaround (vLLM 403)

**Target Users:** Developers and QA engineers who need to verify model functionality, test transcription quality, and demonstrate capabilities to stakeholders.

**Usage Scenarios:**
1. Quick connectivity check before deployment changes
2. Live audio transcription demos for stakeholders
3. Batch testing of audio files for quality assessment
4. Latency and performance benchmarking
5. Cache performance comparison (prefix caching demonstration)

## Constraints

- **Tech Stack**: React + TypeScript frontend, FastAPI Python backend, modular architecture
- **API Integration**: Must use OpenAI-compatible API standard (client library like openai or direct HTTP)
- **WebSocket Protocol**: vLLM-specific WebSocket streaming for real-time audio
- **Audio Formats**: Support common formats (WAV, MP3, MP4, M4A, OGG, FLAC, WEBM)
- **Deployment**: Backend runs locally, frontend serves static files or via dev server
- **Network**: API server at 10.50.193.74 is on internal network — CORS and connectivity considerations

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript + FastAPI stack | Modular, testable, type-safe, handles WebSocket natively | ✓ Good — clean separation of concerns |
| OpenAI-compatible API client | Leverages existing ecosystem, simplifies integration | ✓ Good — single dependency for vLLM calls |
| WebSocket for real-time audio | Required by vLLM streaming protocol | ✓ Good — but 403 fallback needed |
| Prompt caching for system prompts | Reduces latency and token costs for repeated requests | ✓ Good — visible cache badges + compare tool |
| HTTP periodic transcription | WebSocket bridge failed with 403 on vLLM | ✓ Good — 3s interval works well |
| Tailwind CSS v4 | Scaffolded by create-vite, uses @import syntax | ✓ Good — consistent styling |
| Error message centralization | Consistent user guidance across all panels | ✓ Good — errorMap.ts with retry support |

---
*Last updated: 2026-05-06 after v1.0 milestone*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
