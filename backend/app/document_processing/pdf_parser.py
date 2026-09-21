"""
PDF Parser using pypdf.
"""

import logging
from pypdf import PdfReader
from app.document_processing.extractor import BaseParser, ExtractedContent, DocumentSection

logger = logging.getLogger(__name__)

class PDFParser(BaseParser):
    def parse(self, file_path: str) -> ExtractedContent:
        try:
            reader = PdfReader(file_path)
        except Exception as e:
            raise ValueError(f"Failed to read PDF file: {e!s}")

        if not reader.pages:
            raise ValueError("The PDF document has no pages or is unreadable.")

        content = ExtractedContent(total_pages=len(reader.pages))

        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text:
                    content.sections.append(
                        DocumentSection(
                            page_number=i + 1,
                            text=text,
                            metadata={"type": "page"}
                        )
                    )
            except Exception as e:
                logger.warning(f"Failed to extract text from page {i+1}: {e!s}")

        content.normalize()

        if content.total_characters == 0:
            raise ValueError("No text could be extracted from this PDF. It might be an image-only PDF (OCR is not yet supported).")

        return content

