"""Local JSON vector index with deterministic cosine retrieval."""

from __future__ import annotations

import json
import math
from dataclasses import asdict
from pathlib import Path
from typing import Any

from app.rag.chunker import DocumentChunk


class LocalVectorStore:
    def __init__(self, path: Path) -> None:
        self.path = path

    def replace(self, chunks: list[DocumentChunk], embeddings: list[list[float]]) -> None:
        if len(chunks) != len(embeddings):
            raise ValueError("Chunk and embedding counts must match.")
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 1,
            "document_id": chunks[0].document_id if chunks else None,
            "items": [
                {"chunk": asdict(chunk), "embedding": embedding}
                for chunk, embedding in zip(chunks, embeddings, strict=True)
            ],
        }
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")
        temporary.replace(self.path)

    def delete(self) -> None:
        self.path.unlink(missing_ok=True)

    def search(
        self,
        query_embedding: list[float],
        top_k: int,
        minimum_similarity: float,
        document_id: str,
    ) -> list[dict[str, Any]]:
        if not self.path.is_file():
            return []
        payload = json.loads(self.path.read_text(encoding="utf-8"))
        if payload.get("document_id") != document_id:
            return []
        results = []
        for item in payload.get("items", []):
            score = self._cosine(query_embedding, item["embedding"])
            if score >= minimum_similarity:
                results.append({"score": score, **item["chunk"]})
        return sorted(results, key=lambda item: item["score"], reverse=True)[:top_k]

    @staticmethod
    def _cosine(first: list[float], second: list[float]) -> float:
        if len(first) != len(second):
            return 0.0
        first_norm = math.sqrt(sum(value * value for value in first))
        second_norm = math.sqrt(sum(value * value for value in second))
        if not first_norm or not second_norm:
            return 0.0
        return sum(a * b for a, b in zip(first, second, strict=True)) / (
            first_norm * second_norm
        )
