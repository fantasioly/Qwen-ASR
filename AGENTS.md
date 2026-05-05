# AGENTS.md

## Project Context

This is Qwen3-ASR Web Demo Suite — a web-based testing and demonstration tool for the Qwen3-ASR-1.7B speech recognition model deployed via vLLM.

**API Endpoint:** http://10.50.193.74:30003 (OpenAI-compatible)
**Tech Stack:** React + TypeScript + Vite (frontend), FastAPI (backend)

## Planning Artifacts

- `.planning/PROJECT.md` — project context, requirements, decisions
- `.planning/ROADMAP.md` — phase structure and success criteria
- `.planning/REQUIREMENTS.md` — detailed requirements with traceability
- `.planning/STATE.md` — current phase progress
- `.planning/config.json` — workflow configuration
- `.planning/research/` — domain research findings

## GSD Workflow

This project uses the Get-Shit-Done (GSD) workflow. Key commands:

- `/gsd-discuss-phase N` — discuss phase approach
- `/gsd-plan-phase N` — create detailed plan for phase
- `/gsd-execute-phase N` — execute phase plan
- `/gsd-progress` — check current progress
- `/gsd-verify-work` — validate completed work

## Conventions

1. **Atomic commits:** Each logical change is committed separately
2. **TypeScript:** Strict mode, no `any` types
3. **FastAPI:** Async handlers, Pydantic models for request/response
4. **Audio:** Always 16kHz mono PCM for model input
5. **API proxy:** All vLLM calls go through FastAPI backend
