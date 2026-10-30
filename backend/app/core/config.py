import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "RouteMate Core Engine"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"

    # Security & Tokens
    SECRET_KEY: str = "routemate_dev_secret_key_change_in_production_2026!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Supabase Authentication
    SUPABASE_PROJECT_REF: str = "wumuejbouhmyovxbzsif"
    SUPABASE_URL: str = "https://wumuejbouhmyovxbzsif.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_YTo4ngkFPl-HJ8N9PoiMSw_0Zcd8tPX"
    SUPABASE_JWT_SECRET: Optional[str] = None
    SUPABASE_JWKS_URL: str = "https://wumuejbouhmyovxbzsif.supabase.co/auth/v1/.well-known/jwks.json"

    # Database — defaults to SQLite for development (no PostgreSQL install required).
    # Override DATABASE_URL in .env or environment for production PostgreSQL.
    DATABASE_URL: str = "sqlite+aiosqlite:///./routemate_dev.db"

    # Redis URL (optional — only needed for session caching)
    REDIS_URL: str = "redis://localhost:6379/0"

    # External Navigation & Geocoding Providers
    OSRM_ENDPOINT: str = "https://router.project-osrm.org/route/v1/driving"
    PHOTON_ENDPOINT: str = "https://photon.komoot.io/api"

    # Google Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Firebase FCM Server Credentials (Optional JSON file path)
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None

    # CORS Allowed Origins — permissive for development
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
