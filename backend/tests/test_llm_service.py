"""Unit tests for the provider boundary without network calls."""

import json

import pytest

from app.core.config import Settings
from app.core.exceptions import AnalysisUnavailableError, LLMServiceError
from app.schemas.analysis import LegalAnalysisResult
from app.services.llm_service import LLMService


def valid_result() -> dict:
    return {
        "summary": "A short document summary.",
        "document_type": "Agreement",
        "disclaimer": "This is legal information and document analysis, not legal advice.",
    }


class FakeResponse:
    def __init__(self, payload: object):
        self.text = json.dumps(payload)


class FakeModels:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.calls = 0

    def generate_content(self, **kwargs):
        self.calls += 1
        response = next(self.responses)
        if isinstance(response, Exception):
            raise response
        return FakeResponse(response)


class FakeClient:
    def __init__(self, responses):
        self.models = FakeModels(responses)


def service(client, retries=2, sleeps=None):
    settings = Settings(GEMINI_API_KEY="test-key", GEMINI_MAX_RETRIES=retries)
    return LLMService(
        settings=settings,
        client_factory=lambda _: client,
        sleep=(sleeps.append if sleeps is not None else lambda _: None),
    )


def test_missing_api_key_is_cleanly_rejected():
    settings = Settings(GEMINI_API_KEY="")
    with pytest.raises(AnalysisUnavailableError):
        LLMService(settings=settings).generate_structured("prompt", LegalAnalysisResult)


def test_successful_structured_response_is_validated():
    client = FakeClient([valid_result()])
    result = service(client).generate_structured("prompt", LegalAnalysisResult)
    assert result.document_type == "Agreement"
    assert client.models.calls == 1


def test_malformed_json_is_not_retried():
    client = FakeClient(["not-json"])
    with pytest.raises(LLMServiceError):
        service(client).generate_structured("prompt", LegalAnalysisResult)
    assert client.models.calls == 1


def test_pydantic_validation_failure_is_not_retried():
    client = FakeClient([{"summary": "missing required fields"}])
    with pytest.raises(LLMServiceError):
        service(client).generate_structured("prompt", LegalAnalysisResult)
    assert client.models.calls == 1


def test_transient_failure_retries_with_bounded_backoff():
    client = FakeClient([TimeoutError(), valid_result()])
    sleeps = []
    result = service(client, sleeps=sleeps).generate_structured("prompt", LegalAnalysisResult)
    assert result.summary == "A short document summary."
    assert client.models.calls == 2
    assert sleeps == [1]


def test_non_retryable_failure_is_not_retried():
    class BadRequestError(Exception):
        code = 400

    client = FakeClient([BadRequestError()])
    with pytest.raises(LLMServiceError):
        service(client).generate_structured("prompt", LegalAnalysisResult)
    assert client.models.calls == 1
