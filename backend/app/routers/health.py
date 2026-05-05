from fastapi import APIRouter
from openai import OpenAI, APIConnectionError, APITimeoutError
import time
from app.config import settings
from app.errors import structured_error

router = APIRouter()


@router.get("/api/health")
async def health_check():
    client = OpenAI(api_key=settings.api_key, base_url=settings.api_base_url)
    start_time = time.time()

    try:
        models = client.models.list(timeout=settings.request_timeout)
        latency_ms = (time.time() - start_time) * 1000

        if models.data:
            model_name = models.data[0].id
            return {
                "status": "ok",
                "model": model_name,
                "latency_ms": round(latency_ms, 2),
            }
        else:
            return {
                "status": "error",
                "message": "No models loaded on vLLM",
                "code": 503,
            }

    except APITimeoutError:
        raise structured_error(
            error="timeout",
            message=f"API request timed out after {settings.request_timeout}s",
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
            error="internal_error",
            message=str(e),
            code=500,
        )
