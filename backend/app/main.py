"""
OkDriver Pothole Detection API
Entry point for the FastAPI application.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import potholes_router
from app.core.config import settings
from app.core.database import Base, engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup (Alembic handles migrations in prod)
    Base.metadata.create_all(bind=engine)
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("OkDriver API started – env=%s", settings.ENVIRONMENT)
    yield
    logger.info("OkDriver API shutting down")


app = FastAPI(
    title="OkDriver Pothole Detection API",
    description="Detects potholes, maps to civic authorities, and tracks repair status.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow the Vite dev server and any configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False), name="uploads")

# Register routers
app.include_router(potholes_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
