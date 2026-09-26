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
        self.status_code = 200
        self._payload = {"choices": [{"message": {"content": json.dumps(payload)}}]}

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


class FakeTextClient:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.calls = 0
        self.requests = []

    def post(self, path, **kwargs):
        self.calls += 1
        self.requests.append({"path": path, **kwargs})
        response = next(self.responses)
        if isinstance(response, Exception):
            raise response
        return FakeResponse(response)


def service(client, retries=2, sleeps=None):
    settings = Settings(HF_TOKEN="hf-test-token", GEMINI_MAX_RETRIES=retries)
    return LLMService(
        settings=settings,
        text_client_factory=lambda _: client,
        sleep=(sleeps.append if sleeps is not None else lambda _: None),
    )


def test_missing_api_key_is_cleanly_rejected():
    settings = Settings(HF_TOKEN="")
    with pytest.raises(AnalysisUnavailableError):
        LLMService(settings=settings).generate_structured("prompt", LegalAnalysisResult)


def test_successful_structured_response_is_validated():
    client = FakeTextClient([valid_result()])
    result = service(client).generate_structured("prompt", LegalAnalysisResult)
    assert result.document_type == "Agreement"
    assert client.calls == 1
    assert client.requests[0]["json"]["max_tokens"] == 8000


def test_malformed_json_is_not_retried():
    client = FakeTextClient(["not-json"])
    with pytest.raises(LLMServiceError):
        service(client).generate_structured("prompt", LegalAnalysisResult)
    assert client.calls == 1


def test_pydantic_validation_failure_is_not_retried():
    client = FakeTextClient([{"summary": "missing required fields"}])
    res = service(client).generate_structured("prompt", LegalAnalysisResult)
    assert res.summary == "missing required fields"
    assert client.calls == 1


def test_transient_failure_retries_with_bounded_backoff():
    client = FakeTextClient([TimeoutError(), valid_result()])
    sleeps = []
    result = service(client, sleeps=sleeps).generate_structured("prompt", LegalAnalysisResult)
    assert result.summary == "A short document summary."
    assert client.calls == 2
    assert sleeps == [1]


def test_non_retryable_failure_is_not_retried():
    class BadRequestError(Exception):
        code = 400

    client = FakeTextClient([BadRequestError()])
    with pytest.raises(LLMServiceError):
        service(client).generate_structured("prompt", LegalAnalysisResult)
    assert client.calls == 1
