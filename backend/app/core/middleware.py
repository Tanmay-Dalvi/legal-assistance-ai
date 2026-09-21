"""
Custom middleware.

- Request ID injection (for distributed tracing / log correlation)
- Request/response logging
- Unhandled exception logging (so we capture details server-side
  even though we never expose them to the client)
"""

from __future__ import annotations

import time
import traceback
import uuid

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logger = structlog.get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Injects a unique request_id into the structlog context for every request.
    Also measures and logs request duration.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        # Bind request_id so all log statements within this request include it
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            logger.info(
                "request_completed",
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
            )

            # Expose request_id in response headers for client-side correlation
            response.headers["X-Request-ID"] = request_id
            return response

        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "unhandled_exception",
                duration_ms=round(duration_ms, 2),
                exc_info=True,
                traceback=traceback.format_exc(),
            )
            raise

