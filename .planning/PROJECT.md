# Qwen3-ASR Web Demo Suite

## What This Is

A comprehensive Web testing and demonstration suite for the Qwen3-ASR-1.7B speech-to-text model deployed via vLLM. Provides real-time audio transcription, file upload transcription, connection testing, and model capability verification through a modern React frontend with FastAPI backend.

## Core Value

Users can verify the Qwen3-ASR model works correctly through intuitive web interface — testing connectivity, transcribing live audio in real-time, processing uploaded audio files, and validating all model capabilities.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Model connection test — verify API endpoint, authentication, and model availability
- [ ] Real-time audio transcription — capture microphone audio and stream to model via WebSocket for live transcription
- [ ] File upload transcription — upload audio files (WAV, MP3, etc.) and get transcription results
- [ ] Prompt caching — cache system prompts to reduce latency and token costs
- [ ] Model capability verification — test transcription accuracy, latency, and edge cases
- [ ] WebSocket streaming — bidirectional audio streaming and incremental result display

### Out of Scope

- Model training or fine-tuning — this is a demo/testing suite, not a training platform
- Multi-model comparison — focused on single Qwen3-ASR-1.7B model
- User accounts and authentication — no user management needed
- Mobile app — web-only, desktop-first
- Batch processing at scale — single-file upload, not enterprise pipeline

## Context

**Deployed Model:**
- Model: Qwen3-ASR-1.7B (from ModelScope)
- Framework: vLLM
- API Endpoint: http://10.50.193.74:30003
- API Format: OpenAI-compatible REST + WebSocket
- API Key: test

**Target Users:** Developers and QA engineers who need to verify model functionality, test transcription quality, and demonstrate capabilities to stakeholders.

**Usage Scenarios:**
1. Quick connectivity check before deployment changes
2. Live audio transcription demos for stakeholders
3. Batch testing of audio files for quality assessment
4. Latency and performance benchmarking

## Constraints

- **Tech Stack**: React + TypeScript frontend, FastAPI Python backend, modular architecture
- **API Integration**: Must use OpenAI-compatible API standard (client library like openai or direct HTTP)
- **WebSocket Protocol**: vLLM-specific WebSocket streaming for real-time audio
- **Audio Formats**: Support common formats (WAVEncoding, sample rates)
- **Deployment**: Backend runs locally, frontend serves static files or via dev server
- **Network**: API server at 10.50.193.74 is on internal network — CORS and connectivity considerations

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript + FastAPI stack | Modular, testable, type-safe, handles WebSocket natively | — Pending |
| OpenAI-compatible API client | Leverages existing ecosystem, simplifies integration | — Pending |
| WebSocket for real-time audio | Required by vLLM streaming protocol | — Pending |
| Prompt caching for system prompts | Reduces latency and token costs for repeated requests | — Pending |

---
*Last updated: 2025-05-05 after initialization*

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
