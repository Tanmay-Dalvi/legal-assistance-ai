"""Persisted document comparison records."""

import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ComparisonStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Comparison(Base):
    __tablename__ = "comparisons"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_a_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), index=True)
    document_b_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), index=True)
    status: Mapped[ComparisonStatus] = mapped_column(
        String, default=ComparisonStatus.PENDING, index=True
    )
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
