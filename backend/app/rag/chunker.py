"""Deterministic, provenance-preserving document chunking."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from app.document_processing.extractor import ExtractedContent

_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


@dataclass(frozen=True)
class DocumentChunk:
    chunk_id: str
    document_id: str
    section_id: str
    page_number: int | None
    heading: str | None
    text: str
    chunk_index: int
    character_count: int


class ChunkingService:
    def __init__(self, chunk_size: int = 1_200, overlap: int = 200) -> None:
        if chunk_size <= 0 or overlap < 0 or overlap >= chunk_size:
            raise ValueError("Chunk size must be positive and overlap must be smaller than size.")
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_document(self, document_id: str, content: ExtractedContent) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        for section_index, section in enumerate(content.sections, start=1):
            section_id = f"section-{section_index}"
            for text in self._split_section(section.text):
                chunk_index = len(chunks)
                chunk_id = hashlib.sha256(
                    f"{document_id}:{section_id}:{chunk_index}:{text}".encode()
                ).hexdigest()[:32]
                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        section_id=section_id,
                        page_number=section.page_number,
                        heading=section.heading,
                        text=text,
                        chunk_index=chunk_index,
                        character_count=len(text),
                    )
                )
        return chunks

    def _split_section(self, text: str) -> list[str]:
        sentences = _SENTENCE_BOUNDARY.split(" ".join(text.split()))
        chunks: list[str] = []
        current = ""
        for sentence in sentences:
            if not sentence:
                continue
            candidate = f"{current} {sentence}".strip()
            if current and len(candidate) > self.chunk_size:
                chunks.append(current)
                overlap = current[-self.overlap :].strip() if self.overlap else ""
                current = f"{overlap} {sentence}".strip()
            elif len(candidate) <= self.chunk_size:
                current = candidate
            else:
                chunks.extend(self._split_long_text(current))
                current = sentence
        if current:
            chunks.extend(self._split_long_text(current))
        return chunks

    def _split_long_text(self, text: str) -> list[str]:
        if len(text) <= self.chunk_size:
            return [text]
        pieces: list[str] = []
        start = 0
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            if end < len(text):
                boundary = text.rfind(" ", start, end)
                if boundary > start:
                    end = boundary
            piece = text[start:end].strip()
            if piece:
                pieces.append(piece)
            if end >= len(text):
                break
            start = max(end - self.overlap, start + 1)
        return pieces
