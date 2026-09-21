"""
FastAPI application entry point.

Initialises the app, registers middleware, mounts routes,
and configures exception handlers.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from app.core.logging import configure_logging, get_logger
from app.core.middleware import RequestContextMiddleware
from fastapi import HTTPException

settings = get_settings()
logger = get_logger(__name__)


# ------------------------------------------------------------------ #
# Lifespan (startup / shutdown)
# ------------------------------------------------------------------ #


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage application startup and shutdown.
    Resources are initialised here so they are available on the first request.
    """
    configure_logging(
        debug=settings.DEBUG,
        json_logs=settings.is_production,
    )
    logger.info(
        "application_starting",
        name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    # Import models here so Base.metadata.create_all finds them
    import app.models.document  # noqa: F401
    import app.models.analysis  # noqa: F401
    
    from app.core.database import init_db
    await init_db()

    # TODO: initialise vector store connection here

    yield  # application runs

    logger.info("application_shutting_down")
    
    from app.core.database import engine
    await engine.dispose()


# ------------------------------------------------------------------ #
# Application factory
# ------------------------------------------------------------------ #


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "GenAI-powered legal information and assistance platform. "
            "Provides legal information — not legal advice."
        ),
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ---------------------------------------------------------------- #
    # Middleware (order matters: first registered = outermost wrapper)
    # ---------------------------------------------------------------- #

    app.add_middleware(RequestContextMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # ---------------------------------------------------------------- #
    # Exception handlers
    # ---------------------------------------------------------------- #

    from starlette.exceptions import HTTPException as StarletteHTTPException

    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)  # type: ignore[arg-type]

    # ---------------------------------------------------------------- #
    # Routers
    # ---------------------------------------------------------------- #

    app.include_router(api_router)

    return app


app = create_app()

