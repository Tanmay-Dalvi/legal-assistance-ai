"""
Pytest configuration and shared fixtures for the backend test suite.
"""

import os

import pytest
from fastapi.testclient import TestClient

# Ensure tests always use a dedicated test environment
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-production")
os.environ.setdefault("GEMINI_API_KEY", "")  # Not required for foundation tests


@pytest.fixture(scope="session")
def app():
    """Return the FastAPI application instance."""
    # Import here (after env vars set) to avoid config validation errors
    from app.main import create_app

    return create_app()


@pytest.fixture(scope="session")
def client(app):
    """
    Return a synchronous test client for the FastAPI app.
    Uses session scope to avoid repeated app startup overhead.
    """
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

