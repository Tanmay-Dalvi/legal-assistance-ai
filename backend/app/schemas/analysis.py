"""Typed contracts for grounded legal-document analysis."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.models.analysis import AnalysisStatus


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EvidenceReference(BaseModel):
    chunk_id: str | None = None
    document_id: str | None = None
    section_id: str | None = None
    page_number: int | None = Field(default=None, ge=1)
    heading: str | None = None
    quote: str = Field(min_length=1, max_length=2_000)
    claim_type: str = Field(min_length=1, max_length=100)


class KeyPoint(BaseModel):
    point: str
    evidence: list[EvidenceReference] = Field(default_factory=list)


class Obligation(BaseModel):
    party: str | None = None
    obligation: str
    evidence: list[EvidenceReference] = Field(default_factory=list)


class ImportantDate(BaseModel):
    description: str
    date: str | None = None
    evidence: list[EvidenceReference] = Field(default_factory=list)


class FinancialTerm(BaseModel):
    description: str
    amount: str | None = None
    evidence: list[EvidenceReference] = Field(default_factory=list)


class TerminationTerm(BaseModel):
    description: str
    evidence: list[EvidenceReference] = Field(default_factory=list)


class RiskItem(BaseModel):
    description: str
    severity: Severity
    evidence: list[EvidenceReference] = Field(default_factory=list)


class Inconsistency(BaseModel):
    description: str
    evidence: list[EvidenceReference] = Field(default_factory=list)


class LawyerQuestion(BaseModel):
    question: str
    reason: str | None = None
    evidence: list[EvidenceReference] = Field(default_factory=list)


class LegalAnalysisResult(BaseModel):
    summary: str
    document_type: str
    key_points: list[KeyPoint] = Field(default_factory=list)
    obligations: list[Obligation] = Field(default_factory=list)
    important_dates: list[ImportantDate] = Field(default_factory=list)
    financial_terms: list[FinancialTerm] = Field(default_factory=list)
    termination_terms: list[TerminationTerm] = Field(default_factory=list)
    risks: list[RiskItem] = Field(default_factory=list)
    inconsistencies: list[Inconsistency] = Field(default_factory=list)
    questions_for_lawyer: list[LawyerQuestion] = Field(default_factory=list)
    evidence: list[EvidenceReference] = Field(default_factory=list)
    disclaimer: str


class AnalysisResponse(BaseModel):
    id: str
    document_id: str
    status: AnalysisStatus
    result: LegalAnalysisResult | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
