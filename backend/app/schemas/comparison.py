"""Typed contracts for grounded document comparison."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.models.comparison import ComparisonStatus
from app.schemas.analysis import EvidenceReference


class ComparisonRequest(BaseModel):
    document_a_id: str = Field(min_length=1)
    document_b_id: str = Field(min_length=1)


class ChangeCategory(str, Enum):
    SECTION = "section"
    OBLIGATION = "obligation"
    FINANCIAL = "financial"
    DATE = "date"
    TERMINATION = "termination"
    RISK = "risk"


class ChangeSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ComparisonChange(BaseModel):
    category: ChangeCategory
    title: str
    description: str
    document_a_value: str | None = None
    document_b_value: str | None = None
    significance: ChangeSeverity | None = None
    evidence_a: list[EvidenceReference] = Field(default_factory=list)
    evidence_b: list[EvidenceReference] = Field(default_factory=list)


class ComparisonResult(BaseModel):
    executive_summary: str
    document_a_label: str
    document_b_label: str
    unchanged_sections: list[str] = Field(default_factory=list)
    added_sections: list[ComparisonChange] = Field(default_factory=list)
    removed_sections: list[ComparisonChange] = Field(default_factory=list)
    modified_sections: list[ComparisonChange] = Field(default_factory=list)
    obligation_changes: list[ComparisonChange] = Field(default_factory=list)
    financial_changes: list[ComparisonChange] = Field(default_factory=list)
    date_changes: list[ComparisonChange] = Field(default_factory=list)
    termination_changes: list[ComparisonChange] = Field(default_factory=list)
    risk_relevant_changes: list[ComparisonChange] = Field(default_factory=list)
    questions_for_lawyer: list[str] = Field(default_factory=list)
    evidence: list[EvidenceReference] = Field(default_factory=list)
    disclaimer: str


class SectionComparisonResult(BaseModel):
    modified_sections: list[ComparisonChange] = Field(default_factory=list)
    obligation_changes: list[ComparisonChange] = Field(default_factory=list)
    financial_changes: list[ComparisonChange] = Field(default_factory=list)
    date_changes: list[ComparisonChange] = Field(default_factory=list)
    termination_changes: list[ComparisonChange] = Field(default_factory=list)
    risk_relevant_changes: list[ComparisonChange] = Field(default_factory=list)
    questions_for_lawyer: list[str] = Field(default_factory=list)
    disclaimer: str


class ComparisonResponse(BaseModel):
    id: str
    document_a_id: str
    document_b_id: str
    status: ComparisonStatus
    result: ComparisonResult | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
