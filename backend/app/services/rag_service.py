"""Document indexing and local semantic retrieval orchestration."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import AppError, NotFoundError, ValidationError
from app.document_processing.extractor import ExtractedContent
from app.models.document import Document, ProcessingStatus
from app.models.rag import DocumentChunkMetadata, DocumentIndex, IndexStatus
from app.rag.chunker import ChunkingService
from app.rag.vector_store import LocalVectorStore
from app.services import storage_service
from app.services.llm_service import LLMService


class RAGService:
    def __init__(
        self,
        db: AsyncSession,
        llm_service: LLMService | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.llm_service = llm_service or LLMService(self.settings)
        self.chunker = ChunkingService(self.settings.RAG_CHUNK_SIZE, self.settings.RAG_CHUNK_OVERLAP)

    async def _get_document(self, document_id: str) -> Document:
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if document is None:
            raise NotFoundError("Document", document_id)
        return document

    async def get_index(self, document_id: str) -> DocumentIndex:
        await self._get_document(document_id)
        result = await self.db.execute(select(DocumentIndex).where(DocumentIndex.document_id == document_id))
        index = result.scalar_one_or_none()
        if index is None:
            raise NotFoundError("Document index", document_id)
        return index

    async def index_document(self, document_id: str) -> DocumentIndex:
        document = await self._get_document(document_id)
        if document.processing_status != ProcessingStatus.READY:
            raise ValidationError("Document must finish processing before indexing can start.")
        result = await self.db.execute(select(DocumentIndex).where(DocumentIndex.document_id == document_id))
        index = result.scalar_one_or_none()
        if index is None:
            index = DocumentIndex(document_id=document_id, status=IndexStatus.PROCESSING)
            self.db.add(index)
        else:
            index.status = IndexStatus.PROCESSING
            index.error_message = None
        await self.db.commit()
        await self.db.refresh(index)

        try:
            extracted_path = storage_service.get_safe_extracted_path(document_id)
            content = ExtractedContent.model_validate_json(
                Path(extracted_path).read_text(encoding="utf-8")
            )
            chunks = self.chunker.chunk_document(document_id, content)
            embeddings = self.llm_service.embed_texts(
                [chunk.text for chunk in chunks], self.settings.RAG_EMBEDDING_BATCH_SIZE
            )
            LocalVectorStore(storage_service.get_safe_vector_index_path(document_id)).replace(
                chunks, embeddings
            )
            await self.db.execute(delete(DocumentChunkMetadata).where(DocumentChunkMetadata.document_id == document_id))
            for chunk in chunks:
                self.db.add(
                    DocumentChunkMetadata(
                        chunk_id=chunk.chunk_id,
                        document_id=document_id,
                        page_number=chunk.page_number,
                        section_id=chunk.section_id,
                        heading=chunk.heading,
                        chunk_index=chunk.chunk_index,
                        character_count=chunk.character_count,
                    )
                )
            index.status = IndexStatus.READY
            index.chunk_count = len(chunks)
            index.error_message = None
            await self.db.commit()
            await self.db.refresh(index)
            return index
        except Exception as exc:
            index.status = IndexStatus.FAILED
            index.error_message = "Document indexing failed. Please try again."
            LocalVectorStore(storage_service.get_safe_vector_index_path(document_id)).delete()
            await self.db.commit()
            if isinstance(exc, AppError):
                raise
            raise ValidationError("Document indexing failed. Please try again.") from exc

    async def delete_document_index(self, document_id: str) -> None:
        await self._get_document(document_id)
        await self.db.execute(delete(DocumentChunkMetadata).where(DocumentChunkMetadata.document_id == document_id))
        await self.db.execute(delete(DocumentIndex).where(DocumentIndex.document_id == document_id))
        LocalVectorStore(storage_service.get_safe_vector_index_path(document_id)).delete()
        await self.db.commit()

    async def retrieve_relevant_chunks(self, document_id: str, query: str, top_k: int | None = None) -> list[dict]:
        index = await self.get_index(document_id)
        if index.status != IndexStatus.READY:
            return []
        query_embedding = self.llm_service.embed_query(query)
        return LocalVectorStore(storage_service.get_safe_vector_index_path(document_id)).search(
            query_embedding,
            top_k or self.settings.RAG_TOP_K,
            self.settings.RAG_MIN_SIMILARITY,
            document_id,
        )
