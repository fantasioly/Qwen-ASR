# Phase 1: Backend Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 1-Backend Foundation
**Areas discussed:** Config Management, Transcription Endpoint, Health Endpoint, Error Handling & Timeouts

---

## Config Management

| Option | Description | Selected |
|--------|-------------|----------|
| .env file + env vars | Use python-dotenv with .env file, fallback to env vars. Clean, standard for FastAPI. | ✓ |
| JSON config file | config.json with default values, editable via settings API. | |
| Env vars only | No file persistence. Set at launch. | |

**User's choice:** .env file + env vars (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate effect | Backend keeps config in memory, /api/config updates both .env and in-memory. | ✓ |
| Write .env only (restart needed) | Settings writes to .env but server must restart. | |

**User's choice:** Immediate effect (Recommended)

## Transcription Endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| OpenAI-compatible chat completions | Use openai Python SDK, send audio as base64 in chat message. | ✓ |
| Direct HTTP to vLLM | Manual HTTP requests with httpx. | |

**User's choice:** OpenAI-compatible chat completions (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — pass through as-is | Backend forwards uploaded file directly to vLLM. | ✓ |
| Resample to 16kHz mono | Backend uses pydub/ffmpeg to normalize audio. | |

**User's choice:** Minimal — pass through as-is (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Full metadata | Text + detected language + token usage + processing time. | ✓ |
| Minimal (text + language only) | Just transcription text and detected language. | |

**User's choice:** Full metadata (Recommended)

## Health Endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Connectivity + model info | Calls /v1/models, returns status, model name, round-trip latency. | ✓ |
| Full diagnostic | Above plus: server uptime, Python version, vLLM version. | |
| Minimal ping | Just connectivity check with latency. | |

**User's choice:** Connectivity + model info (Recommended)

## Error Handling & Timeouts

| Option | Description | Selected |
|--------|-------------|----------|
| Structured JSON errors | Return {error, message, code}. Frontend displays actionable guidance. | ✓ |
| Raw passthrough | Forward vLLM error response as-is. | |
| Minimal error string | Just return {error: 'friendly message'}. | |

**User's choice:** Structured JSON errors (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable timeout, no auto-retry | Default 30s, configurable via settings. No automatic retry. | ✓ |
| Fixed timeout with retries | 3 retries with exponential backoff. | |
| Very generous timeout (60s+) | 60s+ timeout, no retry. | |

**User's choice:** Configurable timeout, no auto-retry (Recommended)

## Agent's Discretion

None — all areas were explicitly decided.

## Deferred Ideas

None — discussion stayed within phase scope.
