# Phase 4: Real-Time Streaming - Research

**Date:** 2026-05-05
**Domain:** WebSocket streaming audio transcription with vLLM Realtime API

## vLLM WebSocket Realtime API

### Endpoint
- **URL:** `ws://{host}:30003/v1/realtime`
- **Protocol:** WebSocket (RFC 6455)
- **Audio format:** Base64-encoded PCM16 at 16kHz, mono channel

### Client → Server Events

| Event Type | Purpose | Payload |
|-----------|---------|---------|
| `session.update` | Configure model parameters | `{model: "model-name"}` |
| `input_audio_buffer.append` | Send audio chunk | `{audio: "<base64>"}` |
| `input_audio_buffer.commit` | Trigger processing or signal end | `{final: boolean}` |

**Protocol flow:**
1. Connect → receive `session.created`
2. Send `session.update` with model name
3. Send audio chunks via `input_audio_buffer.append`
4. Periodically send `input_audio_buffer.commit` with `final=false` to trigger incremental transcription
5. When done, send `input_audio_buffer.commit` with `final=true` to finalize

### Server → Client Events

| Event Type | Purpose | Payload |
|-----------|---------|---------|
| `session.created` | Connection confirmed | `{session_id, timestamp}` |
| `transcription.delta` | Incremental text | `{delta: "text"}` |
| `transcription.done` | Final result + usage | `{text, usage: {prompt_tokens, completion_tokens}}` |
| `error` | Error notification | `{message}` |

### Key Discovery Findings

1. **vLLM Realtime API uses a specific event protocol** — not OpenAI SSE streaming. This is a dedicated WebSocket protocol at `/v1/realtime`.
2. **Audio must be PCM16 at 16kHz mono** — matches existing pipeline decision (16kHz mono PCM).
3. **`input_audio_buffer.commit(final=false)` triggers incremental processing** — this is how streaming works. Send append → commit → repeat for real-time feel.
4. **`transcription.delta` provides incremental text** — each delta is an increment, not full replacement.
5. **`transcription.done` includes usage stats** — matches Phase 3 token stats pattern.

### Backend Architecture

The backend WebSocket endpoint needs a **protocol bridge** pattern:

```
Frontend frame                          Backend                          vLLM event
─────────────────                       ───────                          ────────────
{type:'audio', data:'base64'}  →  WebSocket handler          →  {type:'input_audio_buffer.append', audio:'base64'}
{type:'start'}                   →                          →  {type:'input_audio_buffer.commit', final:false}
{type:'stop'}                    →                          →  {type:'input_audio_buffer.commit', final:true}
                                                              {type:'session.created'}        →  {type:'connected'}
                                                              {type:'transcription.delta'}    →  {type:'partial', text:...}
                                                              {type:'transcription.done'}     →  {type:'final', text:...}
```

### Dependencies

**Backend:**
- `websockets` library (FastAPI uses `websockets` or `starlette` WebSockets)
- No new dependencies needed — FastAPI has built-in WebSocket support via `WebSocket` and `WebSocketDisconnect`

**Frontend:**
- No new npm packages — native `WebSocket` API suffices
- No new packages for audio — native `AudioContext`, `MediaRecorder`, `ScriptProcessorNode`

### Security Considerations

| Threat | Component | Mitigation |
|--------|-----------|------------|
| WebSocket DoS (connection flood) | Backend WS endpoint | Max connections per IP, connection timeout |
| Audio data eavesdropping | WebSocket transport | Internal network only, no auth needed per project scope |
| Large audio buffer attack | Backend WS handler | Max message size limit (512KB), timeout on idle connections |
| WebSocket replay attack | Backend WS handler | Session-bound connections, no persistent state |

### Audio Resampling Strategy

**Browser-side resampling needed** because microphone typically captures at 44.1kHz or 48kHz, but vLLM requires 16kHz.

**Two approaches:**
1. **ScriptProcessorNode (deprecated but simpler):** `AudioContext.createScriptProcessor(bufferSize, 1, 1)` — processes audio in buffer chunks, can resample inline.
2. **AudioWorklet (modern but complex):** Custom audio processing module, runs on separate thread, better performance.

**Recommendation:** ScriptProcessorNode for Phase 4 MVP — simpler implementation, well-understood, works across all browsers. AudioWorklet can be a future optimization.

### Resampling Implementation

```typescript
// AudioContext setup
const audioCtx = new AudioContext({ sampleRate: 16000 });
// Browser captures at native rate, AudioContext at 16kHz auto-resamples

// Alternative: capture at native rate, resample manually
const inputCtx = new AudioContext(); // Default sample rate (e.g., 48kHz)
// Use OfflineAudioContext or manual resampling to convert to 16kHz
```

**Simpler approach:** Create `AudioContext` with `sampleRate: 16000` — the browser handles resampling from device's native rate to 16kHz automatically. Then use `ScriptProcessorNode` to extract PCM16 chunks.

### Chunk Timing

- **100ms chunks** (~1600 bytes at 16kHz mono 16-bit)
- **Send interval:** `setInterval` or `ScriptProcessorNode.onaudioprocess` callback
- **Buffer size:** `ScriptProcessorNode` default buffer size 2048 samples = 128ms at 16kHz. Use `bufferSize: 1024` for ~64ms or `2048` for ~128ms.

### Vite WebSocket Proxy

Frontend WebSocket connects to `/ws/transcribe` which needs to be proxied to backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/ws': {
      target: 'ws://localhost:8000',
      ws: true, // Enable WebSocket proxying
    },
    '/api': { target: 'http://localhost:8000', changeOrigin: true },
  },
}
```

### Standard Stack

| Area | Recommendation | Notes |
|------|---------------|-------|
| Backend WS support | FastAPI `WebSocket` (built-in) | No new deps |
| Frontend WS client | Native `WebSocket` | No new deps |
| Audio capture | `navigator.mediaDevices.getUserMedia` | Standard Web API |
| Audio resampling | `AudioContext({sampleRate: 16000})` | Browser handles resampling |
| Audio chunking | `ScriptProcessorNode` | Simpler than AudioWorklet |
| PCM encoding | Manual `Int16Array` → base64 | No ffmpeg.wasm needed |
| vLLM protocol | Direct WebSocket to `ws://host/v1/realtime` | Per vLLM Realtime API docs |

### Architecture Patterns

| Pattern | From | To |
|---------|------|-----|
| Existing REST transcribe | `POST /api/transcribe` | OpenAI REST API |
| New WS transcribe | `WS /ws/transcribe` | vLLM WS Realtime API |
| Frontend REST client | XHR upload (transcribe.ts) | N/A |
| Frontend WS client | N/A | Custom WebSocket client |

### Dont Hand-Roll

- Audio format conversion — use browser `AudioContext` native resampling
- WebSocket protocol — follow vLLM Realtime API spec exactly
- PCM encoding — use `Int16Array` and `base64` directly
- Language detection — parse from model output (same as Phase 3 `parse_model_output`)

### Don'ts / Pitfalls

1. **Do NOT use AudioWorklet for MVP** — ScriptProcessorNode is simpler and sufficient
2. **Do NOT buffer all audio then send** — stream continuously for real-time feel
3. **Do NOT forget `input_audio_buffer.commit(final=false)`** — without commits, vLLM won't process audio
4. **Do NOT use `fetch` for WebSocket** — native `WebSocket` is required
5. **ScriptProcessorNode is deprecated** — works in all browsers but will be removed eventually; plan AudioWorklet migration later
6. **Memory leak risk** — always clean up `AudioContext`, `ScriptProcessorNode`, `WebSocket`, and `AbortController` on unmount
7. **CORS for WebSocket** — Vite proxy needs `ws: true` for WebSocket proxying

### Validation Architecture

| Dimension | Test Strategy |
|-----------|--------------|
| Audio capture | Verify `getUserMedia` grants permission, `AudioContext` is active |
| Resampling | Capture at non-16kHz device rate, verify output is 16kHz PCM16 |
| WebSocket connect | Backend WS endpoint accepts connection, sends `session.created` |
| Streaming | Audio chunks sent every ~100ms, server returns `transcription.delta` |
| Final result | `transcription.done` received after `commit(final=true)` |
| Reconnection | Server disconnect → auto-reconnect with exponential backoff |
