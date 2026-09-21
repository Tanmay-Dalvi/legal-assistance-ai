"""RAG index API contracts."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.rag import IndexStatus


class IndexResponse(BaseModel):
    id: str
    document_id: str
    status: IndexStatus
    chunk_count: int
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
