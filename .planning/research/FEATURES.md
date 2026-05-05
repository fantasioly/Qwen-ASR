# Features Research: Qwen3-ASR Web Demo Suite

## Table Stakes (Must Have)

### Connection Testing
- **API connectivity check**: Verify endpoint reachable, model loaded, API key valid
- **Model info display**: Show model name, version, capabilities
- **Latency measurement**: Round-trip ping to API server
- **Health indicator**: Visual status (green/yellow/red) for connection state

### Real-Time Transcription
- **Microphone capture**: Browser-based audio recording with MediaRecorder API
- **16kHz resampling**: Client-side audio resampling to model's expected format
- **WebSocket streaming**: Bidirectional audio chunk streaming via vLLM Realtime API
- **Incremental display**: Real-time updates of partial transcription results
- **Language detection**: Auto-detect language (model supports 30+ languages)

### File Upload Transcription
- **File picker**: Support WAV, MP3, MP4, MPEG, M4A, OGG, FLAC, WEBM formats
- **Progress indicator**: Upload and processing progress bar
- **Result display**: Full transcription with language label
- **Copy/export**: Copy to clipboard or download as text

### Prompt Caching Visualization
- **Cache status**: Show whether prefix caching is active
- **Performance comparison**: With/without cache latency comparison
- **Token usage stats**: Display token counts (prompt, completion)

## Differentiators (Competitive Advantage)

- **Batch testing**: Upload multiple files, get comparative results
- **Audio visualization**: Waveform display of captured/uploaded audio
- **Latency benchmarking**: End-to-end latency measurement and reporting
- **Quality assessment**: Manual rating system for transcription accuracy
- **Export reports**: Generate structured test reports (PDF/Markdown)

## Anti-Features (Deliberately NOT Build)

| Feature | Reason |
|---------|--------|
| User accounts/auth | No user management needed for internal demo |
| Model training/fine-tuning | Out of scope — testing only |
| Multi-model comparison | Single model focus |
| Mobile app | Desktop-first, web-only |
| Real-time collaboration | Not needed for testing demo |

---
*Research completed: 2025-05-05*
