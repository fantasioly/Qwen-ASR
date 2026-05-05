"""WebSocket streaming router — bridges frontend JSON frames to vLLM Realtime API."""

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websockets.legacy.client import connect as ws_connect
from app.config import settings

VALID_TYPES = {"audio", "start", "stop"}

router = APIRouter()


async def connect_vllm():
    """Create WebSocket connection to vLLM Realtime API and configure session."""
    ws_uri = (
        settings.api_base_url
        .replace("http://", "ws://")
        .replace("https://", "wss://")
        .replace("/v1", "/v1/realtime")
    )
    vllm_ws = await ws_connect(ws_uri)
    await vllm_ws.send(
        json.dumps({"type": "session.update", "model": settings.model_name})
    )
    return vllm_ws


@router.websocket("/ws/transcribe")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()

    vllm_ws = None
    try:
        vllm_ws = await connect_vllm()
    except Exception as e:
        try:
            await websocket.send_json(
                {"type": "error", "message": f"Cannot connect to vLLM: {e}"}
            )
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
        return

    async def frontend_to_vllm(stop: asyncio.Event):
        try:
            while not stop.is_set():
                data = await websocket.receive_json()
                if data.get("type") not in VALID_TYPES:
                    continue
                if data["type"] == "audio":
                    await vllm_ws.send(
                        json.dumps(
                            {
                                "type": "input_audio_buffer.append",
                                "audio": data["data"],
                            }
                        )
                    )
                elif data["type"] == "start":
                    await vllm_ws.send(
                        json.dumps(
                            {"type": "input_audio_buffer.commit", "final": False}
                        )
                    )
                elif data["type"] == "stop":
                    await vllm_ws.send(
                        json.dumps(
                            {"type": "input_audio_buffer.commit", "final": True}
                        )
                    )
        except WebSocketDisconnect:
            pass

    async def vllm_to_frontend(stop: asyncio.Event):
        try:
            while not stop.is_set():
                msg = await vllm_ws.recv()
                event = json.loads(msg)
                etype = event.get("type")
                if etype == "session.created":
                    await websocket.send_json({"type": "connected"})
                elif etype == "transcription.delta":
                    await websocket.send_json(
                        {"type": "partial", "text": event.get("delta", "")}
                    )
                elif etype == "transcription.done":
                    await websocket.send_json(
                        {
                            "type": "final",
                            "text": event.get("text", ""),
                            "usage": event.get("usage", {}),
                        }
                    )
                elif etype == "error":
                    await websocket.send_json(
                        {"type": "error", "message": event.get("message", "Unknown error")}
                    )
        except Exception:
            pass

    stop = asyncio.Event()
    task_a = None
    task_b = None
    try:
        task_a = asyncio.create_task(frontend_to_vllm(stop))
        task_b = asyncio.create_task(vllm_to_frontend(stop))
        await asyncio.gather(task_a, task_b)
    except (WebSocketDisconnect, asyncio.CancelledError):
        stop.set()
        if task_a is not None:
            task_a.cancel()
        if task_b is not None:
            task_b.cancel()
        if task_a is not None:
            try:
                await task_a
            except (asyncio.CancelledError, Exception):
                pass
        if task_b is not None:
            try:
                await task_b
            except (asyncio.CancelledError, Exception):
                pass
    finally:
        if vllm_ws is not None:
            try:
                await vllm_ws.close()
            except Exception:
                pass
