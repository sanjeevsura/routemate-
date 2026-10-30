from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints.websocket import router as ws_router
from app.db.base import Base
from app.db.session import engine, get_db
import app.models  # ensure models are registered


from app.db.init_db import init_admin_accounts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup if database is reachable
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[RouteMate] Database tables verified/created successfully.")
        await init_admin_accounts()
    except Exception as e:
        print(f"[RouteMate] Notice: Database connection on startup: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["system"])
@app.get(f"{settings.API_V1_STR}/health", tags=["system"])
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "DISCONNECTED"
    engine_name = "unknown"
    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            db_status = "CONNECTED"
            engine_name = "SQLite (Development Fallback)" if "sqlite" in settings.DATABASE_URL else "PostgreSQL/PostGIS"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    return {
        "status": "ONLINE" if db_status == "CONNECTED" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "database_engine": engine_name,
        "database_url_configured": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    }

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix="/ws", tags=["websocket"])
