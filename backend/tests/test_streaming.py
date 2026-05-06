"""Tests for HTTP-based streaming router — periodic transcription over WebSocket."""

import asyncio
import base64
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from openai import APITimeoutError

from app.routers.streaming import router, VALID_TYPES, pcm16_to_wav_bytes


@pytest.fixture
def test_app():
    _app = FastAPI()
    _app.include_router(router)
    return _app


def _mock_model_response(text: str, language: str = "en"):
    """Create a mock OpenAI chat completion response."""
    mock_choice = MagicMock()
    mock_choice.message.content = f"<language>{language}</language><asr_text>{text}</asr_text>"
    mock_usage = MagicMock()
    mock_usage.prompt_tokens = 50
    mock_usage.completion_tokens = 10
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_response.usage = mock_usage
    return mock_response


def _big_audio_b64(samples: int = 21000) -> str:
    """Return base64-encoded PCM16 audio with enough samples to exceed MIN_BUFFER_BYTES."""
    return base64.b64encode(b"\x00\x01" * samples).decode()


class TestValidTypes:
    def test_valid_types_defined(self):
        assert VALID_TYPES == {"audio", "start", "stop"}


class TestWAVEncoding:
    """Test: WAV encoding produces valid header."""

    def test_wav_encoding_produces_valid_header(self):
        pcm_data = b"\x00\x01" * 100
        wav = pcm16_to_wav_bytes(pcm_data)
        assert wav.startswith(b"RIFF")
        assert b"WAVE" in wav
        assert b"fmt " in wav
        assert b"data" in wav
        assert len(wav) == 44 + 200

    def test_wav_encoding_empty_data(self):
        wav = pcm16_to_wav_bytes(b"")
        assert wav.startswith(b"RIFF")
        assert len(wav) == 44


class TestConnection:
    """Test 1: WS connects, receives {type:'connected'}, no vLLM WS attempted."""

    def test_connection_sends_connected(self, test_app):
        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                data = ws.receive_json()
                assert data["type"] == "connected"

    def test_no_websockets_import_used(self):
        import app.routers.streaming as mod

        source = open(mod.__file__).read()
        assert "from websockets" not in source
        assert "import websockets" not in source
        assert "ws_connect" not in source


class TestAudioBuffering:
    """Test 2: Audio frames buffer, no HTTP calls until 'start'."""

    @patch("app.routers.streaming.OpenAI")
    def test_audio_buffered_without_http_call(self, mock_openai_cls, test_app):
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                audio = base64.b64encode(b"\x00\x01" * 100).decode()
                ws.send_json({"type": "audio", "data": audio})
                ws.send_json({"type": "audio", "data": audio})
                ws.send_json({"type": "audio", "data": audio})

                time.sleep(0.15)

                mock_client.chat.completions.create.assert_not_called()


class TestStartStop:
    """Test 3-4: start begins periodic transcription, stop triggers final."""

    @patch("app.routers.streaming.PERIODIC_INTERVAL", 0.05)
    @patch("app.routers.streaming.OpenAI")
    def test_start_begins_periodic_transcription(self, mock_openai_cls, test_app):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _mock_model_response("Hello world")
        mock_openai_cls.return_value = mock_client

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                big_audio = _big_audio_b64()
                ws.send_json({"type": "audio", "data": big_audio})

                # Start recording
                ws.send_json({"type": "start"})

                # Wait for periodic sleep + transcription
                time.sleep(0.5)

                # Check that OpenAI was called
                mock_client.chat.completions.create.assert_called()

                # Check partial result received
                msg = ws.receive_json()
                assert msg["type"] == "partial"
                assert msg["text"] == "Hello world"

    @patch("app.routers.streaming.OpenAI")
    def test_stop_triggers_final_transcription(self, mock_openai_cls, test_app):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _mock_model_response("Final result")
        mock_openai_cls.return_value = mock_client

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                audio = base64.b64encode(b"\x00\x01" * 100).decode()
                ws.send_json({"type": "audio", "data": audio})
                ws.send_json({"type": "start"})
                ws.send_json({"type": "stop"})

                time.sleep(0.3)

                msg = ws.receive_json()
                assert msg["type"] == "final"
                assert msg["text"] == "Final result"


class TestLanguageExtraction:
    """Test 5: Language extracted from model output using parse_model_output."""

    @patch("app.routers.streaming.OpenAI")
    def test_language_extracted_from_model_output(self, mock_openai_cls, test_app):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _mock_model_response("Nihao", "zh")
        mock_openai_cls.return_value = mock_client

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                audio = base64.b64encode(b"\x00\x01" * 100).decode()
                ws.send_json({"type": "audio", "data": audio})
                ws.send_json({"type": "start"})
                ws.send_json({"type": "stop"})

                time.sleep(0.3)

                msg = ws.receive_json()
                assert msg["type"] == "final"
                assert msg["language"] == "zh"


class TestPartialResults:
    """Test 6: Partial results contain transcription text."""

    @patch("app.routers.streaming.PERIODIC_INTERVAL", 0.05)
    @patch("app.routers.streaming.OpenAI")
    def test_partial_contains_transcription_text(self, mock_openai_cls, test_app):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _mock_model_response("Known text")
        mock_openai_cls.return_value = mock_client

        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected

                big_audio = _big_audio_b64()
                ws.send_json({"type": "audio", "data": big_audio})
                ws.send_json({"type": "start"})

                time.sleep(0.5)

                msg = ws.receive_json()
                assert msg["type"] == "partial"
                assert msg["text"] == "Known text"


class TestHTTPErrorHandling:
    """Test 7: HTTP errors in call_http_transcription return (None, None)."""

    @patch("app.routers.streaming.OpenAI")
    def test_http_timeout_returns_none(self, mock_openai_cls):
        from app.routers.streaming import call_http_transcription
        import httpx

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = APITimeoutError(
            request=httpx.Request("GET", "http://test")
        )
        mock_openai_cls.return_value = mock_client

        wav = pcm16_to_wav_bytes(b"\x00" * 100)
        result = asyncio.get_event_loop().run_until_complete(
            call_http_transcription(wav)
        )
        assert result == (None, None)

    @patch("app.routers.streaming.OpenAI")
    def test_http_connection_error_returns_none(self, mock_openai_cls):
        from app.routers.streaming import call_http_transcription
        from openai import APIConnectionError
        import httpx

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = APIConnectionError(
            request=httpx.Request("GET", "http://test")
        )
        mock_openai_cls.return_value = mock_client

        wav = pcm16_to_wav_bytes(b"\x00" * 100)
        result = asyncio.get_event_loop().run_until_complete(
            call_http_transcription(wav)
        )
        assert result == (None, None)


class TestUnknownFrameTypes:
    def test_unknown_frame_types_ignored(self, test_app):
        with TestClient(test_app) as client:
            with client.websocket_connect("/ws/transcribe") as ws:
                ws.receive_json()  # drain connected
                ws.send_json({"type": "unknown", "data": "test"})
                ws.send_json({"type": "ping"})
                # Connection should stay alive
                ws.send_json({"type": "stop"})
                # No crash, connection still valid
