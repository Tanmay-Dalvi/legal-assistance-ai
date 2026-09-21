"""
Storage Service.

Handles secure file storage in the application data directory.
Prevents path traversal and enforces storage boundaries.
"""

import os
import shutil
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import AppError

settings = get_settings()

# Base directories
_BASE_DATA_DIR = Path("./data").resolve()
UPLOAD_DIR = _BASE_DATA_DIR / "uploads"
EXTRACTED_DIR = _BASE_DATA_DIR / "extracted"
TEMP_DIR = _BASE_DATA_DIR / "temp"


def init_storage() -> None:
    """Ensure storage directories exist."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


# Initialize on import
init_storage()


def get_safe_upload_path(filename: str) -> Path:
    """
    Returns a safe Path for a file in the uploads directory.
    Raises an error if path traversal is attempted.
    """
    safe_path = (UPLOAD_DIR / filename).resolve()
    if not str(safe_path).startswith(str(UPLOAD_DIR)):
        raise AppError("Invalid filename: Path traversal detected.")
    return safe_path


def get_safe_extracted_path(document_id: str) -> Path:
    """
    Returns a safe Path for storing extracted data for a document.
    """
    safe_path = (EXTRACTED_DIR / f"{document_id}.json").resolve()
    if not str(safe_path).startswith(str(EXTRACTED_DIR)):
        raise AppError("Invalid document ID: Path traversal detected.")
    return safe_path


async def save_upload_file(upload_file: UploadFile, stored_filename: str) -> Path:
    """
    Save an uploaded file safely to disk.
    """
    destination = get_safe_upload_path(stored_filename)
    
    # Read/write in chunks to avoid loading giant files into memory
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    except Exception as e:
        if destination.exists():
            destination.unlink()
        raise AppError(f"Failed to save file: {e!s}")
    
    return destination


def delete_document_files(stored_filename: str, document_id: str) -> None:
    """
    Safely delete uploaded and extracted files for a document.
    """
    try:
        upload_path = get_safe_upload_path(stored_filename)
        if upload_path.exists():
            upload_path.unlink()
    except AppError:
        pass

    try:
        extracted_path = get_safe_extracted_path(document_id)
        if extracted_path.exists():
            extracted_path.unlink()
    except AppError:
        pass

