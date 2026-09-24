"""Focused local RAG tests with mocked Gemini calls."""

from pathlib import Path

import pytest

from app.core.config import Settings
from app.core.exceptions import LLMServiceError
from app.document_processing.extractor import DocumentSection, ExtractedContent
from app.rag.chunker import ChunkingService
from app.rag.vector_store import LocalVectorStore
from app.services.llm_service import LLMService


def test_chunking_is_deterministic_and_preserves_provenance():
    content = ExtractedContent(
        sections=[
            DocumentSection(
                heading="Term",
                page_number=4,
                text="The term begins today. The term ends tomorrow. The parties must review it.",
            )
        ]
    )
    service = ChunkingService(chunk_size=45, overlap=10)
    first = service.chunk_document("document-1", content)
    second = service.chunk_document("document-1", content)
    assert first == second
    assert first
    assert all(chunk.section_id == "section-1" for chunk in first)
    assert all(chunk.page_number == 4 for chunk in first)
    assert all(chunk.heading == "Term" for chunk in first)
    assert all(chunk.character_count == len(chunk.text) for chunk in first)


def test_long_sections_overlap_without_losing_text():
    content = ExtractedContent(sections=[DocumentSection(text=" ".join(["word"] * 150))])
    chunks = ChunkingService(chunk_size=100, overlap=20).chunk_document("doc", content)
    assert len(chunks) > 1
    assert chunks[0].text[-20:].strip() in chunks[1].text


def test_empty_document_has_no_chunks():
    assert ChunkingService().chunk_document("doc", ExtractedContent()) == []


def test_local_vector_store_filters_document_and_threshold(tmp_path: Path):
    store = LocalVectorStore(tmp_path / "index.json")
    content = ExtractedContent(sections=[DocumentSection(text="term text")])
    chunks = ChunkingService().chunk_document("doc-a", content)
    store.replace(chunks, [[1.0, 0.0]])
    assert store.search([1.0, 0.0], 5, 0.9, "doc-a")[0]["chunk_id"] == chunks[0].chunk_id
    assert store.search([1.0, 0.0], 5, 0.9, "doc-b") == []
    assert store.search([0.0, 1.0], 5, 0.9, "doc-a") == []


def test_embedding_batches_and_retries():
    class Item:
        values = [0.1, 0.2]

    class Response:
        embeddings = [Item()]

    class Models:
        calls = 0

        def embed_content(self, **kwargs):
            self.calls += 1
            if self.calls == 1:
                raise TimeoutError()
            return Response()

    class Client:
        models = Models()

    sleeps = []
    service = LLMService(
        Settings(GEMINI_API_KEY="test-key", GEMINI_MAX_RETRIES=1),
        client_factory=lambda _: Client(),
        sleep=sleeps.append,
    )
    assert service.embed_texts(["one"]) == [[0.1, 0.2]]
    assert sleeps == [1]


def test_embedding_batches_return_one_vector_per_input():
    class Item:
        def __init__(self, values):
            self.values = values

    class Response:
        def __init__(self, count):
            self.embeddings = [Item([0.1, 0.2]) for _ in range(count)]

    class Models:
        def __init__(self):
            self.calls = []

        def embed_content(self, **kwargs):
            self.calls.append(kwargs)
            return Response(len(kwargs["contents"]))

    class Client:
        def __init__(self):
            self.models = Models()

    client = Client()
    service = LLMService(
        Settings(GEMINI_API_KEY="test-key", GEMINI_EMBEDDING_MODEL="gemini-embedding-2"),
        client_factory=lambda _: client,
    )
    vectors = service.embed_texts(["one", "two", "three"], batch_size=2)
    assert len(vectors) == 3
    assert {len(vector) for vector in vectors} == {2}
    assert [len(call["contents"]) for call in client.models.calls] == [2, 1]
    assert all(call["model"] == "gemini-embedding-2" for call in client.models.calls)


def test_embedding_failure_is_sanitized():
    class Models:
        def embed_content(self, **kwargs):
            raise RuntimeError("provider details must not escape")

    class Client:
        models = Models()

    service = LLMService(
        Settings(GEMINI_API_KEY="test-key", GEMINI_MAX_RETRIES=0),
        client_factory=lambda _: Client(),
    )
    with pytest.raises(LLMServiceError, match="embedding service is unavailable"):
        service.embed_texts(["one"])


def test_local_index_persists_across_store_instances(tmp_path: Path):
    path = tmp_path / "index.json"
    content = ExtractedContent(sections=[DocumentSection(text="persistent text")])
    chunks = ChunkingService().chunk_document("doc", content)
    LocalVectorStore(path).replace(chunks, [[1.0, 0.0]])
    assert LocalVectorStore(path).search([1.0, 0.0], 1, 0.1, "doc")
