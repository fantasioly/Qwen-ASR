"""WebSocket streaming router — HTTP-based periodic transcription.

Bridges frontend JSON frames to vLLM via HTTP /v1/chat/completions.
Frontend protocol unchanged: send audio chunks as base64, receive partial/final results.
"""

import asyncio
import base64
import io
import json
import logging
import struct
import time
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openai import OpenAI, APIConnectionError, APITimeoutError

from app.config import settings
from app.routers.transcribe import SYSTEM_PROMPT, parse_model_output

logger = logging.getLogger(__name__)

VALID_TYPES = {"audio", "start", "stop"}

# Buffer cap: 60s of audio at 16kHz mono 16-bit ~= 1.92 MB
MAX_BUFFER_BYTES = 1920000

# Minimum buffer size for periodic transcription (~2.5s of audio)
MIN_BUFFER_BYTES = 40000

# Periodic transcription interval in seconds
PERIODIC_INTERVAL = 3

# HTTP timeout cap for streaming responsiveness
STREAM_TIMEOUT = 15

router = APIRouter()


def pcm16_to_wav_bytes(pcm_data: bytes) -> bytes:
    """Convert raw PCM16 (16kHz, mono) to a WAV file in memory."""
    buf = io.BytesIO()
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + len(pcm_data)))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))
    buf.write(struct.pack("<H", 1))
    buf.write(struct.pack("<H", 1))
    buf.write(struct.pack("<I", 16000))
    buf.write(struct.pack("<I", 32000))
    buf.write(struct.pack("<H", 2))
    buf.write(struct.pack("<H", 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", len(pcm_data)))
    buf.write(pcm_data)
    return buf.getvalue()


async def call_http_transcription(wav_bytes: bytes) -> tuple[str, str, dict[str, int] | None] | tuple[None, None, None]:
    """Call the vLLM HTTP transcription endpoint.

    Returns (clean_text, language_code, usage_dict) or (None, None, None) on failure.
    usage_dict includes prompt_tokens, completion_tokens, and cache_read_tokens.
    """
    try:
        wav_b64 = base64.b64encode(wav_bytes).decode("utf-8")
        client = OpenAI(api_key=settings.api_key, base_url=settings.api_base_url)

        response = client.chat.completions.create(
            model=settings.model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "audio_url",
                            "audio_url": {"url": f"data:audio/wav;base64,{wav_b64}"},
                        }
                    ],
                },
            ],
            timeout=min(settings.request_timeout, STREAM_TIMEOUT),
        )

        raw = response.choices[0].message.content
        if raw is None:
            return None, None, None
        clean_text, lang = parse_model_output(raw)

        # Extract usage data including cache_read_tokens
        usage_dict = None
        if response.usage:
            cache_read_tokens = 0
            if hasattr(response.usage, "prompt_tokens_details"):
                details = response.usage.prompt_tokens_details
                if details is not None and hasattr(details, "cache_read_tokens"):
                    cache_read_tokens = details.cache_read_tokens or 0
            usage_dict = {
                "prompt_tokens": response.usage.prompt_tokens or 0,
                "completion_tokens": response.usage.completion_tokens or 0,
                "cache_read_tokens": cache_read_tokens,
            }

        return clean_text, lang, usage_dict
    except APITimeoutError:
        return None, None, None
    except APIConnectionError:
        return None, None, None
    except Exception:
        return None, None, None


async def periodic_transcription(
    ws: WebSocket,
    buffer: bytearray,
    stop_event: asyncio.Event,
    recording_flag: list[bool],
    current_task_ref: list[asyncio.Task | None],
):
    """Periodically transcribe accumulated audio buffer every ~3 seconds.

    Sends partial results to the frontend WebSocket.
    Does NOT drain the buffer — re-transcribes full context for continuity.
    """
    try:
        while not stop_event.is_set():
            if not recording_flag[0]:
                break

            await asyncio.sleep(PERIODIC_INTERVAL)

            if stop_event.is_set() or not recording_flag[0]:
                break

            if len(buffer) >= MIN_BUFFER_BYTES:
                snapshot = bytes(buffer)
                wav_bytes = pcm16_to_wav_bytes(snapshot)

                # Cancel any in-flight transcription
                if current_task_ref[0] is not None and not current_task_ref[0].done():
                    current_task_ref[0].cancel()

                task = asyncio.create_task(call_http_transcription(wav_bytes))
                current_task_ref[0] = task

                try:
                    clean_text, lang, usage = await task
                    if clean_text:
                        payload = {"type": "partial", "text": clean_text, "language": lang}
                        if usage:
                            payload["usage"] = usage
                        await ws.send_json(payload)
                    else:
                        await ws.send_json(
                            {
                                "type": "error",
                                "message": "Transcription returned empty result",
                            }
                        )
                except asyncio.CancelledError:
                    pass
                except Exception:
                    try:
                        await ws.send_json(
                            {
                                "type": "error",
                                "message": "Transcription failed",
                            }
                        )
                    except Exception:
                        pass

            await asyncio.sleep(0.1)
    except asyncio.CancelledError:
        pass
    except Exception:
        pass


async def do_final_transcription(
    ws: WebSocket,
    buffer: bytearray,
) -> dict[str, Any] | None:
    """Do a final transcription of the full buffer and return the result dict."""
    if not buffer:
        return None

    wav_bytes = pcm16_to_wav_bytes(bytes(buffer))
    clean_text, lang, usage = await call_http_transcription(wav_bytes)

    if clean_text:
        result = {
            "type": "final",
            "text": clean_text,
            "language": lang,
        }
        if usage:
            result["usage"] = usage
        return result
    return None


@router.websocket("/ws/transcribe")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()

    await websocket.send_json({"type": "connected"})

    audio_buffer: bytearray = bytearray()
    is_recording = False
    stop_event = asyncio.Event()
    current_task_ref: list[asyncio.Task | None] = [None]
    recording_flag = [False]

    periodic_task: asyncio.tasks.Task[None] | None = None

    try:
        while True:
            try:
                raw = await websocket.receive_text()
                data = json.loads(raw)
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                continue

            frame_type = data.get("type")
            if frame_type not in VALID_TYPES:
                continue

            if frame_type == "audio":
                audio_b64 = data.get("data", "")
                try:
                    chunk = base64.b64decode(audio_b64)
                except Exception:
                    continue

                # Enforce buffer cap — flush oldest if exceeded
                if len(audio_buffer) + len(chunk) > MAX_BUFFER_BYTES:
                    overflow = len(audio_buffer) + len(chunk) - MAX_BUFFER_BYTES
                    del audio_buffer[:overflow]

                audio_buffer.extend(chunk)

            elif frame_type == "start":
                if is_recording:
                    continue
                is_recording = True
                recording_flag[0] = True
                stop_event.clear()

                periodic_task = asyncio.create_task(
                    periodic_transcription(
                        websocket, audio_buffer, stop_event, recording_flag, current_task_ref
                    )
                )

            elif frame_type == "stop":
                if not is_recording:
                    continue
                is_recording = False
                recording_flag[0] = False
                stop_event.set()

                # Cancel in-flight transcription
                if current_task_ref[0] is not None and not current_task_ref[0].done():
                    current_task_ref[0].cancel()

                # Cancel periodic task
                if periodic_task is not None and not periodic_task.done():
                    periodic_task.cancel()
                    try:
                        await periodic_task
                    except asyncio.CancelledError:
                        pass

                # Final transcription
                try:
                    result = await asyncio.wait_for(
                        do_final_transcription(websocket, audio_buffer),
                        timeout=min(settings.request_timeout, STREAM_TIMEOUT) + 5,
                    )
                    if result:
                        await websocket.send_json(result)
                except asyncio.TimeoutError:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "Final transcription timed out",
                        }
                    )
                except Exception:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "Final transcription failed",
                        }
                    )

                # Reset state
                audio_buffer.clear()
                periodic_task = None
                current_task_ref[0] = None
                stop_event.clear()

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        # Cleanup
        recording_flag[0] = False
        stop_event.set()

        if current_task_ref[0] is not None and not current_task_ref[0].done():
            current_task_ref[0].cancel()

        if periodic_task is not None and not periodic_task.done():
            periodic_task.cancel()

        try:
            if periodic_task is not None:
                await periodic_task
        except (asyncio.CancelledError, Exception):
            pass

        try:
            if current_task_ref[0] is not None:
                await current_task_ref[0]
        except (asyncio.CancelledError, Exception):
            pass
