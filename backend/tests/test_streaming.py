import asyncio
import json
import base64
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
import pytest_asyncio
import httpx
from fastapi.testclient import TestClient
from fastapi import WebSocket, WebSocketDisconnect

from app.routers.streaming import router, ws_endpoint


@pytest.fixture
def app():
    from fastapi import FastAPI
    _app = FastAPI()
    _app.include_router(router)
    return _app


class TestWebSocketConnection:
    """Test 1: WebSocket endpoint /ws/transcribe accepts connection and sends {type:'connected'}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_connection_sends_connected(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        mock_vllm_ws.recv = AsyncMock()
        mock_vllm_ws.recv.side_effect = asyncio.TimeoutError()

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                data = ws.receive_json()
                assert data["type"] == "connected"


class TestAudioFrameBridge:
    """Test 2: Audio frame → vLLM receives input_audio_buffer.append"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_audio_frame_converts_to_append(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        mock_vllm_ws.recv = AsyncMock()
        mock_vllm_ws.recv.side_effect = asyncio.TimeoutError()

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                # Drain connected message
                ws.receive_json()

                test_audio = "SGVsbG8gV29ybGQ="
                ws.send_json({"type": "audio", "data": test_audio})

                mock_vllm_ws.send.assert_called()
                last_send = json.loads(mock_vllm_ws.send.call_args[0][0])
                assert last_send["type"] == "input_audio_buffer.append"
                assert last_send["audio"] == test_audio


class TestStartFrameBridge:
    """Test 3: Start frame → vLLM receives input_audio_buffer.commit(final=false)"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_start_frame_converts_to_commit_not_final(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        mock_vllm_ws.recv = AsyncMock()
        mock_vllm_ws.recv.side_effect = asyncio.TimeoutError()

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                # Drain connected message
                ws.receive_json()

                ws.send_json({"type": "start"})

                mock_vllm_ws.send.assert_called()
                last_send = json.loads(mock_vllm_ws.send.call_args[0][0])
                assert last_send["type"] == "input_audio_buffer.commit"
                assert last_send["final"] is False


class TestStopFrameBridge:
    """Test 4: Stop frame → vLLM receives input_audio_buffer.commit(final=true)"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_stop_frame_converts_to_commit_final(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        mock_vllm_ws.recv = AsyncMock()
        mock_vllm_ws.recv.side_effect = asyncio.TimeoutError()

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                # Drain connected message
                ws.receive_json()

                ws.send_json({"type": "stop"})

                mock_vllm_ws.send.assert_called()
                last_send = json.loads(mock_vllm_ws.send.call_args[0][0])
                assert last_send["type"] == "input_audio_buffer.commit"
                assert last_send["final"] is True


class TestVLLMDeltaToPartial:
    """Test 5: vLLM transcription.delta → frontend receives {type:'partial', text:delta}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_vllm_delta_converts_to_partial(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        # vLLM sends session.created first, then a delta
        mock_vllm_ws.recv = AsyncMock(side_effect=[
            json.dumps({"type": "session.created", "session_id": "s1", "timestamp": "2026-01-01"}),
            json.dumps({"type": "transcription.delta", "delta": "Hello"}),
            asyncio.TimeoutError(),
        ])

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                # Drain connected message
                ws.receive_json()

                # Send a dummy audio frame to trigger the receive loop
                ws.send_json({"type": "audio", "data": "x"})

                delta_msg = ws.receive_json()
                assert delta_msg["type"] == "partial"
                assert delta_msg["text"] == "Hello"


class TestVLLMDoneToFinal:
    """Test 6: vLLM transcription.done → frontend receives {type:'final', text:..., usage:...}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_vllm_done_converts_to_final(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        mock_vllm_ws.recv = AsyncMock(side_effect=[
            json.dumps({"type": "session.created", "session_id": "s1", "timestamp": "2026-01-01"}),
            json.dumps({
                "type": "transcription.done",
                "text": "Final transcription",
                "usage": {"prompt_tokens": 100, "completion_tokens": 50}
            }),
            asyncio.TimeoutError(),
        ])

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                # Drain connected message
                ws.receive_json()

                ws.send_json({"type": "audio", "data": "x"})

                done_msg = ws.receive_json()
                assert done_msg["type"] == "final"
                assert done_msg["text"] == "Final transcription"
                assert done_msg["usage"]["prompt_tokens"] == 100
                assert done_msg["usage"]["completion_tokens"] == 50


class TestVLLMErrorToFrontend:
    """Test 7: vLLM error → frontend receives {type:'error', message:...}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    async def test_vllm_error_converts_to_error_frame(self, mock_ws_connect):
        mock_vllm_ws = AsyncMock()
        mock_vllm_ws.__aenter__ = AsyncMock(return_value=mock_vllm_ws)
        mock_vllm_ws.__aexit__ = AsyncMock(return_value=False)
        mock_ws_connect.return_value = mock_vllm_ws

        mock_vllm_ws.recv = AsyncMock(side_effect=[
            json.dumps({"type": "session.created", "session_id": "s1", "timestamp": "2026-01-01"}),
            json.dumps({"type": "error", "message": "Model error"}),
            asyncio.TimeoutError(),
        ])

        with TestClient(app()) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                # Drain connected message
                ws.receive_json()

                ws.send_json({"type": "audio", "data": "x"})

                err_msg = ws.receive_json()
                assert err_msg["type"] == "error"
                assert err_msg["message"] == "Model error"
