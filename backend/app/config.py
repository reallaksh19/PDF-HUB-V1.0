from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    max_upload_mb: int = 100
    tmp_ttl_hours: int = 24
    api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
