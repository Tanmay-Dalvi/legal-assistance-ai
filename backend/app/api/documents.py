"""
Document API Endpoints.
"""

from fastapi import APIRouter, UploadFile, File

from app.core.dependencies import DBSessionDep
from app.schemas.document import DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter()

@router.post(
    "/upload", 
    response_model=DocumentResponse, 
    status_code=201,
    summary="Upload a new document",
)
async def upload_document(
    db: DBSessionDep,
    file: UploadFile = File(...),
) -> DocumentResponse:
    service = DocumentService(db)
    doc = await service.ingest_document(file)
    return doc


@router.get(
    "", 
    response_model=list[DocumentResponse],
    summary="List all uploaded documents",
)
async def list_documents(db: DBSessionDep) -> list[DocumentResponse]:
    service = DocumentService(db)
    docs = await service.get_all_documents()
    return docs


@router.get(
    "/{document_id}", 
    response_model=DocumentResponse,
    summary="Get document details",
)
async def get_document(document_id: str, db: DBSessionDep) -> DocumentResponse:
    service = DocumentService(db)
    doc = await service.get_document(document_id)
    return doc


@router.delete(
    "/{document_id}",
    status_code=204,
    summary="Delete a document",
)
async def delete_document(document_id: str, db: DBSessionDep) -> None:
    service = DocumentService(db)
    await service.delete_document(document_id)

