"""
FastAPI dependency injection providers.

All shared resources (settings, DB sessions, services) are injected
via FastAPI's Depends() mechanism — never as global singletons accessed
directly in route handlers.
"""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings

# ------------------------------------------------------------------ #
# Settings dependency
# ------------------------------------------------------------------ #

SettingsDep = Annotated[Settings, Depends(get_settings)]

# ------------------------------------------------------------------ #
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

DBSessionDep = Annotated[AsyncSession, Depends(get_db)]

# ------------------------------------------------------------------ #

