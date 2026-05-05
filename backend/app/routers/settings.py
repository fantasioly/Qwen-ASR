from fastapi import APIRouter
from app.config import UpdateSettingsRequest, settings
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
async def update_settings(new_settings: UpdateSettingsRequest):
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    updates = {}

    field_map = {
        "api_base_url": "API_BASE_URL",
        "api_key": "API_KEY",
        "port": "PORT",
        "cors_origins": "CORS_ORIGINS",
        "request_timeout": "REQUEST_TIMEOUT",
    }

    for field, env_key in field_map.items():
        value = getattr(new_settings, field)
        if value is not None:
            updates[env_key] = str(value)

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
