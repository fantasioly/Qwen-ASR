from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    api_base_url: str = "http://10.50.193.74:30003/v1"
    api_key: str = "test"
    port: int = 8000
    cors_origins: str = "http://localhost:5173"
    request_timeout: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = AppSettings()
