from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import settings as settings_router
from app.routers import health
from app.routers import transcribe

app = FastAPI(title="Qwen3-ASR Demo Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_error_response(exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "error", "message": str(exc.detail), "code": exc.status_code},
    )


app.add_exception_handler(Exception, format_error_response)

app.include_router(settings_router.router)
app.include_router(health.router)
app.include_router(transcribe.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Qwen3-ASR Demo Backend"}
