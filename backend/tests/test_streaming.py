"""Tests for WebSocket streaming router — protocol bridge between frontend and vLLM."""

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.streaming import router, VALID_TYPES

SESSION_CREATED = json.dumps(
    {"type": "session.created", "session_id": "s1", "timestamp": "2026-01-01"}
)


@pytest.fixture
def test_app():
    _app = FastAPI()
    _app.include_router(router)
    return _app


def _make_mock_vllm(recv_values: list) -> AsyncMock:
    """Create mock vLLM WebSocket with configurable recv responses.
    
    recv_values is a list of return values for mock.recv().
    Append Exception subclasses to trigger raises.
    """
    mock = AsyncMock()
    mock.recv = AsyncMock(side_effect=recv_values)
    return mock


class TestValidTypes:
    def test_valid_types_defined(self):
        assert VALID_TYPES == {"audio", "start", "stop"}


class TestWebSocketConnection:
    """Test 1: WebSocket endpoint /ws/transcribe accepts connection and sends {type:'connected'}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    def test_connection_sends_connected(self, mock_ws_connect, test_app):
        import asyncio

        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED, asyncio.TimeoutError])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                data = ws.receive_json()
                assert data["type"] == "connected"


class TestAudioFrameBridge:
    """Test 2: Audio frame → vLLM receives input_audio_buffer.append"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    def test_audio_frame_converts_to_append(self, mock_ws_connect, test_app):
        import asyncio

        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
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
    def test_start_frame_converts_to_commit_not_final(self, mock_ws_connect, test_app):
        import asyncio

        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                ws.send_json({"type": "start"})

                # session.update was sent by connect_vllm, then commit by start
                calls = [json.loads(c[0][0]) for c in mock_vllm_ws.send.call_args_list]
                commit_calls = [c for c in calls if c["type"] == "input_audio_buffer.commit"]
                assert len(commit_calls) >= 1
                assert commit_calls[-1]["final"] is False


class TestStopFrameBridge:
    """Test 4: Stop frame → vLLM receives input_audio_buffer.commit(final=true)"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    def test_stop_frame_converts_to_commit_final(self, mock_ws_connect, test_app):
        import asyncio

        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                ws.send_json({"type": "stop"})

                calls = [json.loads(c[0][0]) for c in mock_vllm_ws.send.call_args_list]
                commit_calls = [c for c in calls if c["type"] == "input_audio_buffer.commit"]
                assert len(commit_calls) >= 1
                assert commit_calls[-1]["final"] is True


class TestVLLMDeltaToPartial:
    """Test 5: vLLM transcription.delta → frontend receives {type:'partial', text:delta}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    def test_vllm_delta_converts_to_partial(self, mock_ws_connect, test_app):
        delta_msg = json.dumps({"type": "transcription.delta", "delta": "Hello"})
        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED, delta_msg])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected
                ws.send_json({"type": "audio", "data": "x"})

                result = ws.receive_json()
                assert result["type"] == "partial"
                assert result["text"] == "Hello"


class TestVLLMDoneToFinal:
    """Test 6: vLLM transcription.done → frontend receives {type:'final', text:..., usage:...}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    def test_vllm_done_converts_to_final(self, mock_ws_connect, test_app):
        done_msg = json.dumps({
            "type": "transcription.done",
            "text": "Final transcription",
            "usage": {"prompt_tokens": 100, "completion_tokens": 50},
        })
        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED, done_msg])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected
                ws.send_json({"type": "audio", "data": "x"})

                result = ws.receive_json()
                assert result["type"] == "final"
                assert result["text"] == "Final transcription"
                assert result["usage"]["prompt_tokens"] == 100
                assert result["usage"]["completion_tokens"] == 50


class TestVLLMErrorToFrontend:
    """Test 7: vLLM error → frontend receives {type:'error', message:...}"""

    @patch("app.routers.streaming.ws_connect", new_callable=AsyncMock)
    def test_vllm_error_converts_to_error_frame(self, mock_ws_connect, test_app):
        err_msg = json.dumps({"type": "error", "message": "Model error"})
        mock_vllm_ws = _make_mock_vllm([SESSION_CREATED, err_msg])
        mock_ws_connect.return_value = mock_vllm_ws

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected
                ws.send_json({"type": "audio", "data": "x"})

                result = ws.receive_json()
                assert result["type"] == "error"
                assert result["message"] == "Model error"
