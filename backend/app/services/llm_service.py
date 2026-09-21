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

    def embed_texts(self, texts: list[str], batch_size: int = 16) -> list[list[float]]:
        """Embed text batches through the same lazy Gemini client."""
        if not texts:
            return []
        client = self._get_client()
        embeddings: list[list[float]] = []
        try:
            from google.genai import types

            for start in range(0, len(texts), batch_size):
                batch = texts[start : start + batch_size]
                response = self._embed_with_retry(
                    client, batch, types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
                )
                for item in getattr(response, "embeddings", []):
                    values = getattr(item, "values", None)
                    if not values:
                        raise ValueError("Embedding response was empty.")
                    embeddings.append([float(value) for value in values])
            if len(embeddings) != len(texts):
                raise ValueError("Embedding response count did not match input count.")
            return embeddings
        except AnalysisUnavailableError:
            raise
        except Exception as exc:
            logger.error("gemini_embedding_failed")
            raise LLMServiceError("The document embedding service is unavailable.") from exc

    def embed_query(self, query: str) -> list[float]:
        """Embed one retrieval query using the query task type."""
        client = self._get_client()
        try:
            from google.genai import types

            response = self._embed_with_retry(
                client, [query], types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
            )
            item = getattr(response, "embeddings", [None])[0]
            values = getattr(item, "values", None)
            if not values:
                raise ValueError("Embedding response was empty.")
            return [float(value) for value in values]
        except AnalysisUnavailableError:
            raise
        except Exception as exc:
            logger.error("gemini_query_embedding_failed")
            raise LLMServiceError("The query embedding service is unavailable.") from exc

    def _embed_with_retry(self, client: Any, contents: list[str], config: Any) -> Any:
        attempts = self.settings.GEMINI_MAX_RETRIES + 1
        for attempt in range(attempts):
            try:
                return client.models.embed_content(
                    model=self.settings.GEMINI_EMBEDDING_MODEL,
                    contents=contents,
                    config=config,
                )
            except Exception as exc:
                if not self._is_retryable(exc) or attempt == attempts - 1:
                    raise
                self._sleep(min(2**attempt, 8))
        raise LLMServiceError("The embedding service is unavailable.")
