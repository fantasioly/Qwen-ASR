---
phase: 3
slug: file-upload-transcription
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-05
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Backend /api/transcribe | User-selected audio files cross via XHR POST (multipart/form-data). Files validated client-side before send. | Audio files (WAV/MP3/M4A/OGG/FLAC/WEBM, max 50MB) |
| Drag-drop file data → onFiles callback | User-selected files from browser File API. Validated by enqueue → validateFile(). | File objects from browser File API |
| Copy button → clipboard.writeText() | User-initiated action. Clipboard API requires user gesture. | Transcription text to system clipboard |
| Client file → Backend parse | Model output is parsed server-side. No user input crosses this boundary. | Base64-encoded audio, model output (internal) |
| uploadAudio callback → UI | Progress percentage from XHR upload events reported to React state. No user input, internal pipeline. | Progress percentage (0-100) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Spoofing | validateFile() | mitigate | Client-side extension check against SUPPORTED_EXTENSIONS whitelist (transcribe.ts:33) | closed |
| T-03-02 | Tampering | uploadAudio() file size | mitigate | MAX_FILE_SIZE_BYTES (50MB) check in validateFile() (transcribe.ts:40) | closed |
| T-03-03 | Repudiation | useTranscribeQueue | accept | Internal demo — no auth. Timestamps on results sufficient for debugging. (See Accepted Risks) | closed |
| T-03-04 | Info Disclosure | TranscribeResponse.text | accept | Transcription text stored in client memory, never persisted to server. (See Accepted Risks) | closed |
| T-03-05 | DoS | processQueue() queue growth | mitigate | Sequential processing loop with processingRef gate prevents re-entry. AbortController for cleanup. (useTranscribeQueue.ts:74-80) | closed |
| T-03-06 | Spoofing | FileUploadZone file input | mitigate | Accept attribute restricts to audio extensions. Real gate is validateFile() via enqueue. (FileUploadZone.tsx:107) | closed |
| T-03-07 | Tampering | ResultCard clipboard.writeText | mitigate | Browser enforces user-gesture-only clipboard access. No privilege escalation possible. (ResultCard.tsx:19) | closed |
| T-03-08 | Info Disclosure | ResultCard text display | accept | Transcription text displayed in browser memory only. Never transmitted to third party. (See Accepted Risks) | closed |
| T-03-09 | DoS | FileUploadPanel enqueue flood | mitigate | Queue processes sequentially. processingRef guard prevents parallel execution. 50MB per-file limit. Zone disabled during processing. (FileUploadPanel.tsx:60, useTranscribeQueue.ts:74-80) | closed |
| T-03-10 | Injection | parse_model_output regex | accept | Regex only extracts from model output (trusted internal source from vLLM). No user input crosses this boundary. (transcribe.py:45-75) | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-03 | Internal demo tool — no authentication required. Timestamps on results are sufficient for debugging and audit purposes. | Phase 3 planning | 2026-05-05 |
| AR-03-02 | T-03-04 | Transcription text exists only in client-side React state. Never persisted to server or transmitted to third parties. Acceptable for demo scope. | Phase 3 planning | 2026-05-05 |
| AR-03-03 | T-03-08 | Transcription result text rendered in browser DOM. Not transmitted externally. Acceptable for demo scope. | Phase 3 planning | 2026-05-05 |
| AR-03-04 | T-03-10 | parse_model_output regex processes only the response from the trusted internal vLLM model endpoint. No user-controlled input reaches this code path. | Phase 3 planning | 2026-05-05 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-05 | 10 | 10 | 0 | gsd-security-auditor (autonomous) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-05
