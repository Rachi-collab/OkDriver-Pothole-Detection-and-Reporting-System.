from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "OkDriver Pothole API"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "dev-secret-change-in-prod"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    DEMO_MODE: bool = False

    # Database
    DATABASE_URL: str = "postgresql://pothole_user:changeme@localhost:5432/pothole_db"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    REPORT_FROM_EMAIL: str = "noreply@okdriver.in"

    # Files
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
