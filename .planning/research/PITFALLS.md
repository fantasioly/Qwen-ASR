# Pitfalls Research: Qwen3-ASR Web Demo Suite

## Critical Pitfalls

### 1. CORS Issues with Internal API
**Warning Signs:** Browser console shows CORS errors when calling vLLM directly from frontend
**Prevention:** FastAPI backend acts as proxy — frontend only talks to backend, backend talks to vLLM
**Phase:** Phase 1 (Backend foundation) — ensure proxy pattern from day one

### 2. Browser Audio Format Mismatch
**Warning Signs:** Model returns empty text or garbage output from microphone audio
**Prevention:**
- Resample to exactly 16kHz mono PCM (model expects 16kHz sampling rate)
- Convert to WAV format before sending to API
- Test with both MediaRecorder (WebM/OPUS) and raw PCM streams
**Phase:** Phase 4 (Real-time streaming) — build audio processing carefully

### 3. WebSocket Connection Management
**Warning Signs:** Dropped connections, incomplete transcriptions, memory leaks
**Prevention:**
- Implement reconnection logic with exponential backoff
- Track connection state explicitly (connecting/connected/disconnected)
- Clean up WebSocket resources on component unmount
- Set appropriate timeouts for idle connections
**Phase:** Phase 4 (Real-time streaming)

### 4. vLLM Realtime API Protocol Details
**Warning Signs:** Server rejects WebSocket messages, protocol errors
**Prevention:**
- Study vLLM Realtime API message format (JSON messages over WebSocket)
- Send audio as base64-encoded PCM chunks
- Handle conversation lifecycle: create → input_audio_transcription → respond → done
- Test with curl/wscat before building full UI
**Phase:** Phase 3-4 — prototype WebSocket protocol early

### 5. Prompt Caching Not Working as Expected
**Warning Signs:** No latency improvement on repeated requests
**Prevention:**
- vLLM enables prefix caching by default — verify with `enable_prefix_caching` flag
- Ensure system prompt is identical across requests (even whitespace matters)
- Use `cache_salt` for multi-user isolation if needed
- Monitor cache hit/miss metrics from vLLM prometheus endpoint
**Phase:** Phase 5 (Enhancement)

### 6. Large Audio File Upload Timeout
**Warning Signs:** Request timeout for files >30 seconds
**Prevention:**
- vLLM default max audio file size is 25MB — configure `VLLM_MAX_AUDIO_CLIP_FILESIZE_MB`
- Set FastAPI upload timeout appropriately
- Show upload progress on frontend
- Consider chunked upload for very long files
**Phase:** Phase 3 (File transcription)

### 7. Model Output Parsing
**Warning Signs:** Raw model output contains special tokens or formatting artifacts
**Prevention:**
- Use `qwen_asr.parse_asr_output()` to extract language and text
- Handle streaming deltas correctly (token-by-token accumulation)
- Test edge cases: silence, non-speech audio, mixed languages
**Phase:** Phase 3-4 — build parser early

## Summary

| Risk | Severity | Phase to Address |
|------|----------|------------------|
| CORS / network | High | Phase 1 |
| Audio format mismatch | High | Phase 4 |
| WebSocket management | Medium | Phase 4 |
| vLLM API protocol | Medium | Phase 3-4 |
| Prompt caching | Low | Phase 5 |
| Upload timeout | Medium | Phase 3 |
| Output parsing | Medium | Phase 3-4 |

---
*Research completed: 2025-05-05*
