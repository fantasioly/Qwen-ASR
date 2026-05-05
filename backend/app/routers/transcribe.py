from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from openai import OpenAI, APIConnectionError, APITimeoutError
import base64
import time
from app.config import settings
from app.errors import structured_error

router = APIRouter()

SYSTEM_PROMPT = "You are a speech recognition assistant. Transcribe the audio content accurately."


@router.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    client = OpenAI(api_key=settings.api_key, base_url=settings.api_base_url)
    start_time = time.time()

    try:
        audio_content = await file.read()
        audio_base64 = base64.b64encode(audio_content).decode("utf-8")

        response = client.chat.completions.create(
            model=settings.model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "audio_url",
                            "audio_url": {
                                "url": f"data:audio/wav;base64,{audio_base64}"
                            },
                        }
                    ],
                },
            ],
            timeout=settings.request_timeout,
        )

        processing_time_ms = (time.time() - start_time) * 1000
        result_text = response.choices[0].message.content

        return JSONResponse(
            content={
                "text": result_text,
                "language": "unknown",
                "usage": {
                    "prompt_tokens": (
                        response.usage.prompt_tokens if response.usage else 0
                    ),
                    "completion_tokens": (
                        response.usage.completion_tokens if response.usage else 0
                    ),
                },
                "processing_time_ms": round(processing_time_ms, 2),
            }
        )

    except APITimeoutError:
        raise structured_error(
            error="timeout",
            message=f"Transcription timed out after {settings.request_timeout}s",
            code=504,
        )
    except APIConnectionError:
        raise structured_error(
            error="connection_failed",
            message="Cannot connect to vLLM server",
            code=503,
        )
    except Exception as e:
        raise structured_error(
            error="transcription_failed",
            message=str(e),
            code=500,
        )
