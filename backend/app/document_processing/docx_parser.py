"""
DOCX Parser using python-docx.
"""

import docx
from app.document_processing.extractor import BaseParser, ExtractedContent, DocumentSection

class DocxParser(BaseParser):
    def parse(self, file_path: str) -> ExtractedContent:
        try:
            doc = docx.Document(file_path)
        except Exception as e:
            raise ValueError(f"Failed to read DOCX file: {e!s}")

        content = ExtractedContent()
        
        current_heading = None
        current_text_blocks = []

        # Simplistic parsing: group paragraphs by heading
        # In a real app, this can be far more complex, extracting tables too.
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
                
            style_name = para.style.name.lower() if para.style else ""
            
            if "heading" in style_name:
                # Save previous block
                if current_text_blocks:
                    content.sections.append(
                        DocumentSection(
                            heading=current_heading,
                            text="\n\n".join(current_text_blocks)
                        )
                    )
                    current_text_blocks = []
                
                current_heading = text
                # Also include heading in text block so it's searchable
                current_text_blocks.append(text)
            else:
                current_text_blocks.append(text)

        # Catch remaining
        if current_text_blocks:
            content.sections.append(
                DocumentSection(
                    heading=current_heading,
                    text="\n\n".join(current_text_blocks)
                )
            )

        content.normalize()

        if content.total_characters == 0:
            raise ValueError("No text could be extracted from this DOCX document.")

        return content

