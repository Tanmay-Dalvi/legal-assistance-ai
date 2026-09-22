"""
Application-level exception definitions.

Centralizes error types and provides consistent JSON error responses.
Internal error details are never exposed to clients in production.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


# ------------------------------------------------------------------ #
# Domain exceptions
# ------------------------------------------------------------------ #


class AppError(Exception):
    """Base class for all application-specific errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.detail = detail or {}


class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: Any = None) -> None:  # noqa: ANN401
        msg = f"{resource} not found"
        if identifier is not None:
            msg = f"{resource} '{identifier}' not found"
        super().__init__(
            message=msg,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
        )


class ValidationError(AppError):
    def __init__(self, message: str, detail: dict[str, Any] | None = None) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            detail=detail,
        )


class FileTooLargeError(AppError):
    def __init__(self, max_mb: int) -> None:
        super().__init__(
            message=f"File exceeds the maximum allowed size of {max_mb} MB.",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            error_code="FILE_TOO_LARGE",
        )


class UnsupportedFileTypeError(AppError):
    def __init__(self, allowed: list[str]) -> None:
        super().__init__(
            message=f"Unsupported file type. Allowed types: {', '.join(allowed)}.",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            error_code="UNSUPPORTED_FILE_TYPE",
        )


class LLMServiceError(AppError):
    def __init__(self, message: str = "The AI service encountered an error.") -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="LLM_SERVICE_ERROR",
        )


class ConfigurationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="CONFIGURATION_ERROR",
        )


class AnalysisUnavailableError(AppError):
    def __init__(self) -> None:
        super().__init__(
            message="Document analysis is temporarily unavailable.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="ANALYSIS_UNAVAILABLE",
        )


class AnalysisConflictError(AppError):
    def __init__(self) -> None:
        super().__init__(
            message="Document analysis is already in progress.",
            status_code=status.HTTP_409_CONFLICT,
            error_code="ANALYSIS_IN_PROGRESS",
        )


class AnalysisInputTooLargeError(AppError):
    def __init__(self, max_characters: int) -> None:
        super().__init__(
            message=(
                "This document is too large for direct analysis. "
                f"The current limit is {max_characters:,} characters."
            ),
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            error_code="ANALYSIS_INPUT_TOO_LARGE",
        )


class InvalidAnalysisError(AppError):
    def __init__(self) -> None:
        super().__init__(
            message="The analysis service returned an invalid result.",
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="INVALID_ANALYSIS_RESULT",
        )


class ComparisonInputTooLargeError(AppError):
    def __init__(self, max_characters: int) -> None:
        super().__init__(
            message=(
                "These documents are too large for direct comparison. "
                f"The current limit is {max_characters:,} combined characters."
            ),
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            error_code="COMPARISON_INPUT_TOO_LARGE",
        )


class ComparisonConflictError(AppError):
    def __init__(self) -> None:
        super().__init__(
            message="This document pair is already being compared.",
            status_code=status.HTTP_409_CONFLICT,
            error_code="COMPARISON_IN_PROGRESS",
        )


# ------------------------------------------------------------------ #
# FastAPI exception handlers
# ------------------------------------------------------------------ #


def _error_response(
    status_code: int,
    error_code: str,
    message: str,
    detail: dict[str, Any] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    if detail:
        body["error"]["detail"] = detail
    return JSONResponse(status_code=status_code, content=body)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return _error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        detail=exc.detail if exc.detail else None,
    )


from starlette.exceptions import HTTPException as StarletteHTTPException

async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return _error_response(
        status_code=exc.status_code,
        error_code="HTTP_ERROR",
        message=str(exc.detail),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler. Never expose internal details to the client.
    The actual error is logged by the middleware.
    """
    return _error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_ERROR",
        message="An unexpected error occurred. Please try again later.",
    )

