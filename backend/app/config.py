from pydantic import BaseModel, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class UpdateSettingsRequest(BaseModel):
    model_config = {"extra": "forbid"}

    api_base_url: str | None = None
    api_key: str | None = None
    port: int | None = None
    cors_origins: str | None = None
    request_timeout: int | None = None

    @field_validator("api_base_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is not None:
            try:
                from urllib.parse import urlparse

                result = urlparse(v)
                if not all([result.scheme, result.netloc]):
                    raise ValueError(f"Invalid URL: {v}")
            except Exception as e:
                raise ValueError(f"Invalid URL: {v}")
        return v


class AppSettings(BaseSettings):
    api_base_url: str = "http://10.50.193.74:30003/v1"
    api_key: str = "test"
    port: int = 8000
    cors_origins: str = "http://localhost:5173"
    request_timeout: int = 30
    model_name: str = "/bmcp_lvm_fs/cusa/models/Qwen3-ASR-1.7B"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = AppSettings()
