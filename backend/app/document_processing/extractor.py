"""
Base Extractor and data structures.
"""

from typing import Any
from pydantic import BaseModel, Field

class DocumentSection(BaseModel):
    page_number: int | None = None
    heading: str | None = None
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)

class ExtractedContent(BaseModel):
    sections: list[DocumentSection] = Field(default_factory=list)
    total_characters: int = 0
    total_pages: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    def normalize(self) -> None:
        """
        Basic normalization: strip excess whitespace.
        (Preserves line breaks and structure within sections).
        """
        for section in self.sections:
            section.text = section.text.strip()
        
        # Remove empty sections
        self.sections = [s for s in self.sections if s.text]
        
        self.total_characters = sum(len(s.text) for s in self.sections)


class BaseParser:
    def parse(self, file_path: str) -> ExtractedContent:
        raise NotImplementedError

