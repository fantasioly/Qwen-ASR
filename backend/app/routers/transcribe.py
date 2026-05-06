from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from openai import OpenAI, APIConnectionError, APITimeoutError
import base64
import re
import time
from app.config import settings
from app.errors import structured_error

router = APIRouter()

SYSTEM_PROMPT = (
    "You are a speech recognition assistant. "
    "First detect the spoken language. "
    "Output in this exact format:\n"
    "<language>XX</language>\n"
    "<asr_text>transcription here</asr_text>"
)

LANGUAGE_MAP = {
    "english": "en", "chinese": "zh", "mandarin": "zh",
    "japanese": "ja", "korean": "ko",
    "french": "fr", "german": "de", "spanish": "es",
    "portuguese": "pt", "russian": "ru", "arabic": "ar",
    "indonesian": "id", "italian": "it", "turkish": "tr",
    "polish": "pl", "vietnamese": "vi", "thai": "th",
    "dutch": "nl", "czech": "cs", "romanian": "ro",
    "hindi": "hi", "ukrainian": "uk", "swedish": "sv",
    "hungarian": "hu", "danske": "da", "danish": "da",
    "finnish": "fi", "norwegian": "no",
    "hebrew": "iw", "malay": "ms",
}


def _resolve_language(raw_lang: str) -> str:
    """Map a natural language name to a 2-letter ISO code."""
    name = raw_lang.lower().strip()
    if name in LANGUAGE_MAP:
        return LANGUAGE_MAP[name]
    if len(name) == 2:
        return name
    return raw_lang


def parse_model_output(raw: str) -> tuple[str, str]:
    """Parse Qwen3-ASR model output, extracting language and transcription.

    Handles three formats:
    1. Structured tags: <language>XX</language><asr_text>...</asr_text>
    2. Natural prefix: "language English<asr_text>..." or "language 中文\n..."
    3. Fallback: entire text as transcription, language = "unknown"

    Returns: (clean_text, language_code)
    """
    # Strategy 1: <language>XX</language><asr_text>...</asr_text>
    m = re.search(r"<language>\s*(.+?)\s*</language>", raw)
    t = re.search(r"<asr_text>(.+?)</asr_text>", raw)
    if m and t:
        raw_lang = m.group(1).strip().lower()
        clean_text = t.group(1).strip()
        lang_code = _resolve_language(raw_lang)
        return clean_text, lang_code

    # Strategy 2: "language XX<asr_text>..." or "language XX\n..."
    m = re.match(r"(?:language|\u8bed\u8a00)\s+(\S+?)(?:\s*<asr_text>|[\n:])", raw, re.IGNORECASE)
    if m:
        raw_lang = m.group(1).strip().rstrip(":")
        tail = raw[m.end():]
        clean_text = re.sub(r"^<asr_text>\s*", "", tail).strip()
        clean_text = re.sub(r"</asr_text>\s*$", "", clean_text).strip()
        lang_code = _resolve_language(raw_lang)
        return clean_text, lang_code

    # Strategy 3: fallback
    return raw.strip(), "unknown"


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
        raw_output = response.choices[0].message.content
        result_text, detected_language = parse_model_output(raw_output)

        # Extract usage data including cache_read_tokens from prefix caching
        cache_read_tokens = 0
        if response.usage and hasattr(response.usage, "prompt_tokens_details"):
            details = response.usage.prompt_tokens_details
            if details is not None and hasattr(details, "cache_read_tokens"):
                cache_read_tokens = details.cache_read_tokens or 0

        return JSONResponse(
            content={
                "text": result_text,
                "language": detected_language,
                "usage": {
                    "prompt_tokens": (
                        response.usage.prompt_tokens if response.usage else 0
                    ),
                    "completion_tokens": (
                        response.usage.completion_tokens if response.usage else 0
                    ),
                    "cache_read_tokens": cache_read_tokens,
                },
                "cache_read_tokens": cache_read_tokens,
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
