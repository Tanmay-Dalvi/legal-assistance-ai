"""Structured document Q&A contracts."""

from pydantic import BaseModel, Field

from app.schemas.analysis import EvidenceReference


class QARequest(BaseModel):
    question: str = Field(min_length=1, max_length=2_000)


class QAResult(BaseModel):
    answer: str
    evidence: list[EvidenceReference] = Field(default_factory=list)
    disclaimer: str
    not_found: bool = False
