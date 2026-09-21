"""Indexing and document Q&A API endpoints."""

from fastapi import APIRouter

from app.core.dependencies import DBSessionDep
from app.schemas.qa import QARequest, QAResult
from app.schemas.rag import IndexResponse
from app.services.qa_service import QAService
from app.services.rag_service import RAGService

router = APIRouter()


@router.post("/{document_id}/index", response_model=IndexResponse)
async def index_document(document_id: str, db: DBSessionDep) -> IndexResponse:
    return await RAGService(db).index_document(document_id)


@router.get("/{document_id}/index/status", response_model=IndexResponse)
async def get_index_status(document_id: str, db: DBSessionDep) -> IndexResponse:
    return await RAGService(db).get_index(document_id)


@router.delete("/{document_id}/index", status_code=204)
async def delete_index(document_id: str, db: DBSessionDep) -> None:
    await RAGService(db).delete_document_index(document_id)


@router.post("/{document_id}/qa", response_model=QAResult)
async def answer_question(document_id: str, request: QARequest, db: DBSessionDep) -> QAResult:
    rag_service = RAGService(db)
    return await QAService(rag_service).answer(document_id, request.question)
