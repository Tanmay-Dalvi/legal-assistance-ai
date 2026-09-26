"""
Document API schemas.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.document import ProcessingStatus

class DocumentResponse(BaseModel):
    id: str
    original_filename: str
    file_type: str
    file_size: int
    processing_status: ProcessingStatus
    error_message: str | None = None
    extracted_character_count: int | None = None
    page_count: int | None = None
    upload_timestamp: datetime
    index_status: str | None = None
    index_chunk_count: int | None = None

    model_config = ConfigDict(from_attributes=True)

