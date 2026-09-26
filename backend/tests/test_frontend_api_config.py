import re
from pathlib import Path

def test_frontend_api_url_construction_is_safe():
    """
    Regression test to ensure frontend VITE_API_BASE_URL does not create duplicated
    /api/v1/api/v1 paths and correctly strips trailing slashes.
    """
    root = Path(__file__).resolve().parents[2]
    constants_path = root / "frontend" / "src" / "utils" / "constants.ts"
    
    if not constants_path.exists():
        return  # Skip if frontend is missing
        
    content = constants_path.read_text(encoding="utf-8")
    
    # Must strip trailing slashes to prevent //api/v1
    assert "replace(/\\/+$/, '')" in content, "constants.ts must strip trailing slashes from VITE_API_BASE_URL"
    
    # Must NOT automatically append /api/v1 in the base constant, because clients do it explicitly
    assert "|| '/api/v1'" not in content, "constants.ts must not fallback to '/api/v1' if clients explicitly append it"

def test_cors_config_parses_comma_separated_strings():
    from app.core.config import Settings
    
    # Simulate Vercel setting the env var as a plain string
    settings = Settings(CORS_ORIGINS="https://my-vercel-app.vercel.app, http://localhost:5173")
    
    assert "https://my-vercel-app.vercel.app" in settings.CORS_ORIGINS
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert isinstance(settings.CORS_ORIGINS, list)
