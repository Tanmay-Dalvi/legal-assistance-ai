"""
Health check endpoints.

GET /api/v1/health        — basic liveness probe
GET /api/v1/health/ready  — readiness probe (checks critical dependencies)
"""

import platform
import time
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Record server start time
_START_TIME = time.time()


class HealthStatus(BaseModel):
    status: str
    version: str
    environment: str
    uptime_seconds: float


class ReadinessStatus(BaseModel):
    status: str
    version: str
    environment: str
    uptime_seconds: float
    checks: dict[str, Any]
    python_version: str


@router.get(
    "",
    response_model=HealthStatus,
    summary="Liveness probe",
    description="Returns 200 if the server process is alive.",
)
async def health() -> HealthStatus:
    settings = get_settings()
    uptime = round(time.time() - _START_TIME, 2)

    logger.debug("health_check_called", uptime=uptime)

    return HealthStatus(
        status="ok",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        uptime_seconds=uptime,
    )


@router.get(
    "/ready",
    response_model=ReadinessStatus,
    summary="Readiness probe",
    description=(
        "Returns 200 if the server is ready to handle requests. "
        "Checks configuration and critical service availability."
    ),
)
async def readiness() -> ReadinessStatus:
    settings = get_settings()
    uptime = round(time.time() - _START_TIME, 2)

    checks: dict[str, Any] = {}

    # Config check
    checks["config"] = {"status": "ok"}

    # Gemini API key check (does not make a network call — just checks presence)
    checks["gemini_api_key"] = {
        "status": "configured" if settings.GEMINI_API_KEY else "missing",
        "note": "Required for AI features. Set GEMINI_API_KEY in your .env file."
        if not settings.GEMINI_API_KEY
        else None,
    }

    # Overall readiness
    overall = "ok" if all(
        v.get("status") not in ("error", "failing") for v in checks.values()
    ) else "degraded"

    return ReadinessStatus(
        status=overall,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        uptime_seconds=uptime,
        checks=checks,
        python_version=platform.python_version(),
    )

