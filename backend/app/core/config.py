from pydantic_settings import BaseSettings, SettingsConfigDict

JWT_LIFETIME_SECONDS = 3600
MAX_DISPLAY_NAME_LENGTH = 80
MAX_TEAM_NAME_LENGTH = 80
MAX_TIMEZONE_LENGTH = 64
MIN_PASSWORD_LENGTH = 8
MAX_ACTIVITY_TITLE_LENGTH = 120
MAX_ACTIVITY_INSTRUCTIONS_LENGTH = 4000
DEFAULT_ACTIVITY_MINUTES = 3
MAX_ACTIVITY_MINUTES = 60
DEFAULT_INVITATION_TTL_DAYS = 7
MAX_INVITATION_TTL_DAYS = 30
RECENT_ACTIVITY_WINDOW_DAYS = 7
DEFAULT_HISTORY_LIMIT = 30
MAX_HISTORY_LIMIT = 90


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://kyt:kyt@localhost:5432/kyt"
    secret_key: str
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"
    auth_rate_limit_max: int = 20
    auth_rate_limit_window_seconds: int = 60
    invitation_create_rate_limit_max: int = 10
    invitation_create_rate_limit_window_seconds: int = 3600
    invitation_join_rate_limit_max: int = 20
    invitation_join_rate_limit_window_seconds: int = 3600

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
