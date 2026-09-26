"""Google GenAI adapter with lazy client creation and bounded retries."""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from typing import Any, TypeVar

import httpx
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
        text_client_factory: Callable[[Settings], httpx.Client] | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self.settings = settings or get_settings()
        self._client_factory = client_factory or self._create_client
        self._text_client_factory = text_client_factory or self._create_text_client
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

    def _create_text_client(self, settings: Settings) -> httpx.Client:
        if not settings.HF_TOKEN:
            raise AnalysisUnavailableError()
        return httpx.Client(
            base_url=settings.HF_BASE_URL.rstrip("/"),
            headers={
                "Authorization": f"Bearer {settings.HF_TOKEN}",
                "Content-Type": "application/json",
                            },
            timeout=settings.GEMINI_TIMEOUT_SECONDS,
        )

    @staticmethod
    def _is_retryable(exc: Exception) -> bool:
        if isinstance(exc, TimeoutError | ConnectionError | OSError | httpx.RequestError):
            return True
        code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
        if code is None:
            response = getattr(exc, "response", None)
            code = getattr(response, "status_code", None)
        return isinstance(code, int) and (code == 429 or code >= 500)

    def generate_structured(self, prompt: str, response_schema: type[ModelT]) -> ModelT:
        from app.utils.normalizer import normalize_legal_analysis
        attempts = self.settings.GEMINI_MAX_RETRIES + 1
        try:
            client = self._text_client_factory(self.settings)
        except AnalysisUnavailableError:
            raise
        except Exception as exc:
            raise AnalysisUnavailableError() from exc

        for attempt in range(attempts):
            try:
                response = client.post(
                    "/chat/completions",
                    json={
                        "model": self.settings.HF_MODEL,
                        "max_tokens": self.settings.HF_MAX_TOKENS,
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {
                            "type": "json_object",
                        },
                    },
                )
                response.raise_for_status()
                payload = response.json()
                raw_text = payload["choices"][0]["message"]["content"]
                if not raw_text:
                    raise ValueError("Model returned no structured content.")
                
                try:
                    payload_dict = json.loads(raw_text)
                except json.JSONDecodeError as exc:
                    cleaned_text = raw_text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                    payload_dict = json.loads(cleaned_text)

                normalized = normalize_legal_analysis(payload_dict, schema_name=response_schema.__name__)
                return response_schema.model_validate(normalized)
            except ValidationError as exc:
                print("PYDANTIC VALIDATION ERROR:", exc.errors())
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
        import hashlib
        import re
        import math
        
        if not texts:
            return []
        
        dim = 384
        embeddings = []
        
        for text in texts:
            vector = [0.0] * dim
            words = re.findall(r'\w+', text.lower())
            
            for word in words:
                idx = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16) % dim
                vector[idx] += 1.0
                
            norm = math.sqrt(sum(v * v for v in vector))
            if norm > 0:
                vector = [v / norm for v in vector]
            else:
                vector[0] = 1.0 # fallback
            embeddings.append(vector)
            
        return embeddings

    def embed_query(self, query: str) -> list[float]:
        embeddings = self.embed_texts([query])
        return embeddings[0]
