# Requirements: Qwen3-ASR Web Demo Suite

**Defined:** 2025-05-05
**Core Value:** Users can verify the Qwen3-ASR model works correctly through intuitive web interface

## v1 Requirements

### Connection Test

- [ ] **CONN-01**: User can check if the vLLM API server is reachable and see connection status
- [ ] **CONN-02**: User can see the loaded model name and basic model info
- [ ] **CONN-03**: User can measure API round-trip latency
- [ ] **CONN-04**: System displays visual health indicator (connected/disconnected/error)

### File Upload Transcription

- [ ] **FILE-01**: User can upload audio files (WAV, MP3, MP4, M4A, OGG, FLAC, WEBM)
- [ ] **FILE-02**: User sees upload progress and processing status
- [ ] **FILE-03**: System returns transcription text with detected language label
- [ ] **FILE-04**: User can copy transcription result to clipboard
- [ ] **FILE-05**: User can see token usage stats (prompt tokens, completion tokens)

### Real-Time Transcription

- [ ] **RT-01**: User can start/stop microphone audio capture
- [ ] **RT-02**: System resamples microphone audio to 16kHz and streams via WebSocket
- [ ] **RT-03**: User sees incremental transcription updates in real-time
- [ ] **RT-04**: User can see detected language during streaming
- [ ] **RT-05**: System handles WebSocket disconnect and shows reconnection status
- [ ] **RT-06**: User can see final complete transcription after stopping capture

### Prompt Caching

- [ ] **CACHE-01**: User can see whether prefix caching is active for a request
- [ ] **CACHE-02**: User can compare latency with and without cache
- [ ] **CACHE-03**: System displays cache hit/miss information in results

### UI/UX

- [x] **UI-01**: Interface has a clean dashboard layout with distinct sections per feature
- [x] **UI-02**: API configuration (base URL, API key) is configurable via settings
- [ ] **UI-03**: Error messages are user-friendly with actionable guidance
- [ ] **UI-04**: Interface is responsive and works on desktop browser

## v2 Requirements

### Advanced Testing

- **TEST-01**: User can batch upload multiple files for comparison
- **TEST-02**: User can run latency benchmark with multiple requests
- **TEST-03**: User can export test results as structured report (Markdown/PDF)
- **TEST-04**: User can rate transcription accuracy manually

### Audio Visualization

- **VIS-01**: User can see audio waveform of captured/uploaded audio
- **VIS-02**: User can see real-time audio level meter during recording

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts and authentication | Internal demo, no user management needed |
| Model training or fine-tuning | Testing/demo only, not training platform |
| Multi-model comparison | Focused on single Qwen3-ASR-1.7B model |
| Mobile app | Desktop-first, web-only interface |
| Real-time collaboration | Not needed for testing use case |
| Speech-to-text translation | Model supports transcription only, not translation |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONN-01 | Phase 2 | Pending |
| CONN-02 | Phase 2 | Pending |
| CONN-03 | Phase 2 | Pending |
| CONN-04 | Phase 2 | Pending |
| FILE-01 | Phase 3 | Pending |
| FILE-02 | Phase 3 | Pending |
| FILE-03 | Phase 3 | Pending |
| FILE-04 | Phase 3 | Pending |
| FILE-05 | Phase 3 | Pending |
| RT-01 | Phase 4 | Pending |
| RT-02 | Phase 4 | Pending |
| RT-03 | Phase 4 | Pending |
| RT-04 | Phase 4 | Pending |
| RT-05 | Phase 4 | Pending |
| RT-06 | Phase 4 | Pending |
| CACHE-01 | Phase 5 | Pending |
| CACHE-02 | Phase 5 | Pending |
| CACHE-03 | Phase 5 | Pending |
| UI-01 | Phase 2 | Complete (02-01) |
| UI-02 | Phase 1 | Complete (02-01) |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2025-05-05*
*Last updated: 2025-05-05 after initial definition*
