"""
Document Service.
Coordinates file saving, metadata database records, and extraction.
"""

import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from fastapi import UploadFile

from app.models.document import Document, ProcessingStatus
from app.models.analysis import Analysis
from app.models.rag import DocumentChunkMetadata, DocumentIndex
from app.models.comparison import Comparison
from app.core.exceptions import (
    NotFoundError,
    UnsupportedFileTypeError,
    ValidationError,
)
from app.core.config import get_settings
from app.services import storage_service
from app.document_processing.pdf_parser import PDFParser
from app.document_processing.docx_parser import DocxParser
from app.document_processing.txt_parser import TxtParser

settings = get_settings()

EXPECTED_MIME_TYPES = {
    "pdf": {"application/pdf"},
    "docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    "txt": {"text/plain"},
}

def get_parser(file_type: str):
    if file_type == "pdf":
        return PDFParser()
    elif file_type == "docx":
        return DocxParser()
    elif file_type == "txt":
        return TxtParser()
    raise UnsupportedFileTypeError(settings.ALLOWED_EXTENSIONS)


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ingest_document(self, upload_file: UploadFile) -> Document:
        """
        Coordinates the entire ingestion flow.
        """
        # Validate filename and type
        original_filename = upload_file.filename or "unknown_file"
        file_ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""
        
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise UnsupportedFileTypeError(settings.ALLOWED_EXTENSIONS)

        content_type = (upload_file.content_type or "").lower()
        if content_type not in EXPECTED_MIME_TYPES[file_ext]:
            raise UnsupportedFileTypeError(settings.ALLOWED_EXTENSIONS)
        
        # Generate safe internal IDs
        doc_id = str(uuid.uuid4())
        stored_filename = f"{doc_id}.{file_ext}"
        
        # Save file to disk
        file_path = await storage_service.save_upload_file(upload_file, stored_filename)
        file_size = file_path.stat().st_size
        
        if file_size == 0:
            file_path.unlink()
            raise ValidationError("Uploaded file is empty.")
            
        if file_size > settings.max_upload_size_bytes:
            file_path.unlink()
            from app.core.exceptions import FileTooLargeError
            raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)
            
        # Magic bytes validation
        with open(file_path, "rb") as f:
            header = f.read(4)
        
        is_valid_format = True
        if file_ext == "pdf":
            if not header.startswith(b"%PDF"):
                is_valid_format = False
        elif file_ext == "docx":
            # DOCX is a zip file
            if not header.startswith(b"PK\x03\x04"):
                is_valid_format = False
        elif file_ext == "txt":
            # Just verify it can be decoded as text, no null bytes
            with open(file_path, "rb") as f:
                chunk = f.read(1024)
                if b"\x00" in chunk:
                    is_valid_format = False
                    
        if not is_valid_format:
            file_path.unlink()
            raise ValidationError(f"File content does not match the {file_ext.upper()} extension.")

            
        # Create DB record (status: uploaded)
        doc = Document(
            id=doc_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_type=file_ext,
            mime_type=content_type,
            file_size=file_size,
            storage_path=str(file_path.name),
            processing_status=ProcessingStatus.PROCESSING,
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        
        # Extract text
        try:
            parser = get_parser(file_ext)
            extracted_content = parser.parse(str(file_path))
            
            # Save extracted metadata to DB
            doc.extracted_character_count = extracted_content.total_characters
            doc.page_count = extracted_content.total_pages
            doc.processing_status = ProcessingStatus.READY
            
            # Save extracted JSON structure to safe storage
            extracted_path = storage_service.get_safe_extracted_path(doc_id)
            with extracted_path.open("w", encoding="utf-8") as f:
                f.write(extracted_content.model_dump_json())
                
        except ValueError as e:
            storage_service.delete_document_files(doc.stored_filename, doc.id)
            await self.db.delete(doc)
            await self.db.commit()
            raise ValidationError("The uploaded document could not be read or is malformed.") from e
        except Exception:
            # Keep an auditable record, but never expose parser or filesystem details.
            doc.processing_status = ProcessingStatus.FAILED
            doc.error_message = "Document processing failed. Please try again."
            
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        
        return doc

    async def get_document(self, document_id: str) -> Document:
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundError("Document", document_id)
        return doc
        
    async def get_all_documents(self) -> list[Document]:
        result = await self.db.execute(select(Document).order_by(Document.created_at.desc()))
        return list(result.scalars().all())
        
    async def delete_document(self, document_id: str) -> None:
        doc = await self.get_document(document_id)
        
        await self.db.execute(delete(Analysis).where(Analysis.document_id == document_id))
        await self.db.execute(delete(DocumentChunkMetadata).where(DocumentChunkMetadata.document_id == document_id))
        await self.db.execute(delete(DocumentIndex).where(DocumentIndex.document_id == document_id))
        await self.db.execute(
            delete(Comparison).where(
                (Comparison.document_a_id == document_id)
                | (Comparison.document_b_id == document_id)
            )
        )
        # Remove DB record
        await self.db.delete(doc)
        await self.db.commit()
        
        # Safely remove files
        storage_service.delete_document_files(doc.stored_filename, doc.id)

