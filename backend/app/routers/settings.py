from fastapi import APIRouter
from app.config import AppSettings, settings
from app.errors import structured_error_response
import os

router = APIRouter()


@router.get("/api/settings")
async def get_settings():
    return {
        "api_base_url": settings.api_base_url,
        "api_key": "***" if settings.api_key else "",
        "port": settings.port,
        "cors_origins": settings.cors_origins,
        "request_timeout": settings.request_timeout,
        "model_name": settings.model_name,
    }


@router.put("/api/settings")
async def update_settings(new_settings: dict):
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    updates = {}

    if "api_base_url" in new_settings:
        updates["API_BASE_URL"] = new_settings["api_base_url"]
    if "api_key" in new_settings:
        updates["API_KEY"] = new_settings["api_key"]
    if "port" in new_settings:
        updates["PORT"] = str(new_settings["port"])
    if "cors_origins" in new_settings:
        updates["CORS_ORIGINS"] = new_settings["cors_origins"]
    if "request_timeout" in new_settings:
        updates["REQUEST_TIMEOUT"] = str(new_settings["request_timeout"])

    if updates:
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                lines = f.readlines()

            new_lines = []
            updated_keys = set()
            for line in lines:
                key = line.split("=")[0].strip()
                if key in updates:
                    new_lines.append(f"{key}={updates[key]}\n")
                    updated_keys.add(key)
                else:
                    new_lines.append(line)

            for key, value in updates.items():
                if key not in updated_keys:
                    new_lines.append(f"{key}={value}\n")

            with open(env_path, "w") as f:
                f.writelines(new_lines)
        else:
            with open(env_path, "w") as f:
                for key, value in updates.items():
                    f.write(f"{key}={value}\n")

    for key, value in updates.items():
        env_key = key.upper()
        attr_name = key.lower()
        if hasattr(settings, attr_name):
            current_value = getattr(settings, attr_name)
            if isinstance(current_value, int):
                setattr(settings, attr_name, int(value))
            else:
                setattr(settings, attr_name, value)

    return {
        "status": "ok",
        "message": "Settings updated",
        "updated_keys": list(updates.keys()),
    }
