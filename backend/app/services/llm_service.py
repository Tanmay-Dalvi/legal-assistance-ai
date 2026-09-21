"""Google GenAI adapter with lazy client creation and bounded retries."""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from app.core.config import Settings, get_settings
from app.core.exceptions import AnalysisUnavailableError, LLMServiceError
from app.core.logging import get_logger

logger = get_logger(__name__)
ModelT = TypeVar("ModelT", bound=BaseModel)


class LLMService:
    """Small provider boundary that keeps SDK details out of analysis code."""

    def __init__(
        self,
        settings: Settings | None = None,
        client_factory: Callable[[Settings], Any] | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self.settings = settings or get_settings()
        self._client_factory = client_factory or self._create_client
        self._sleep = sleep
        self._client: Any | None = None

    def _create_client(self, settings: Settings) -> Any:
        if not settings.GEMINI_API_KEY:
            raise AnalysisUnavailableError()
        try:
            from google import genai
            from google.genai import types

            return genai.Client(
                api_key=settings.GEMINI_API_KEY,
                http_options=types.HttpOptions(
                    timeout=int(settings.GEMINI_TIMEOUT_SECONDS * 1_000)
                ),
            )
        except AnalysisUnavailableError:
            raise
        except Exception as exc:
            logger.error("gemini_client_initialization_failed")
            raise AnalysisUnavailableError() from exc

    def _get_client(self) -> Any:
        if self._client is None:
            self._client = self._client_factory(self.settings)
        return self._client

    @staticmethod
    def _is_retryable(exc: Exception) -> bool:
        if isinstance(exc, TimeoutError | ConnectionError | OSError):
            return True
        code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
        return isinstance(code, int) and (code == 429 or code >= 500)

    def generate_structured(
        self,
        prompt: str,
        response_schema: type[ModelT],
    ) -> ModelT:
        """Generate and validate structured JSON without exposing provider errors."""
        try:
            client = self._get_client()
        except AnalysisUnavailableError:
            raise
        except Exception as exc:
            raise AnalysisUnavailableError() from exc

        attempts = self.settings.GEMINI_MAX_RETRIES + 1
        for attempt in range(attempts):
            try:
                from google.genai import types

                response = client.models.generate_content(
                    model=self.settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    ),
                )
                raw_text = getattr(response, "text", None)
                if not raw_text:
                    raise ValueError("Model returned no structured content.")
                payload = json.loads(raw_text)
                return response_schema.model_validate(payload)
            except ValidationError as exc:
                logger.warning("gemini_response_validation_failed")
                raise LLMServiceError("The analysis response could not be validated.") from exc
            except (json.JSONDecodeError, TypeError, ValueError) as exc:
                logger.warning("gemini_response_parse_failed")
                raise LLMServiceError("The analysis response was malformed.") from exc
            except Exception as exc:
                if not self._is_retryable(exc) or attempt == attempts - 1:
                    logger.error("gemini_request_failed", retryable=self._is_retryable(exc))
                    raise LLMServiceError() from exc
                delay = min(2**attempt, 8)
                logger.warning("gemini_request_retry", attempt=attempt + 1)
                self._sleep(delay)

        raise LLMServiceError()
