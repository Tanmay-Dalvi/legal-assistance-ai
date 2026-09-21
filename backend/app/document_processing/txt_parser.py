"""
TXT Parser.
"""

from app.document_processing.extractor import BaseParser, ExtractedContent, DocumentSection

class TxtParser(BaseParser):
    def parse(self, file_path: str) -> ExtractedContent:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except UnicodeDecodeError:
            # Fallback to a broader encoding if utf-8 fails
            try:
                with open(file_path, "r", encoding="latin-1") as f:
                    text = f.read()
            except Exception as e:
                raise ValueError(f"Failed to read TXT file encoding: {e!s}")
        except Exception as e:
            raise ValueError(f"Failed to read TXT file: {e!s}")

        content = ExtractedContent()
        
        # Split by double newline to form logical sections if possible
        blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
        
        for i, block in enumerate(blocks):
            content.sections.append(
                DocumentSection(
                    text=block,
                    metadata={"block_index": i}
                )
            )
            
        content.normalize()

        if content.total_characters == 0:
            raise ValueError("The text file is empty.")

        return content

