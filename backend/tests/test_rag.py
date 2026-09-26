import pytest
from app.services.llm_service import LLMService
from app.core.config import Settings
from app.core.exceptions import LLMServiceError

def test_embedding_batches_return_one_vector_per_input():
    service = LLMService(Settings(HF_TOKEN="test-token", GEMINI_API_KEY="test-token"))
    vectors = service.embed_texts(["one", "two", "three"], batch_size=2)
    assert len(vectors) == 3
    assert {len(vector) for vector in vectors} == {384}

def test_embedding_produces_consistent_hashes():
    service = LLMService(Settings(HF_TOKEN="test-token", GEMINI_API_KEY="test-token"))
    vectors1 = service.embed_texts(["termination clause limit"])
    vectors2 = service.embed_texts(["termination clause limit"])
    
    assert len(vectors1) == 1
    assert len(vectors2) == 1
    assert vectors1[0] == vectors2[0]

def test_embedding_query_matches_document():
    service = LLMService(Settings(HF_TOKEN="test-token", GEMINI_API_KEY="test-token"))
    query = service.embed_query("termination")
    assert len(query) == 384
    assert isinstance(query[0], float)

def test_embedding_empty_text():
    service = LLMService(Settings(HF_TOKEN="test-token", GEMINI_API_KEY="test-token"))
    assert service.embed_texts([]) == []
    
    # Empty string should return fallback vector
    empty_vec = service.embed_texts([""])[0]
    assert empty_vec[0] == 1.0
    assert sum(empty_vec[1:]) == 0.0

