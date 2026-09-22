"""
API v1 router — aggregates all endpoint routers.
"""

from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.documents import router as documents_router
from app.api.analysis import router as analysis_router
from app.api.qa import router as qa_router
from app.api.comparison import router as comparison_router

# Prefix for all API v1 routes
api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(analysis_router, prefix="/documents", tags=["Analysis"])
api_router.include_router(qa_router, prefix="/documents", tags=["RAG and Q&A"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(comparison_router, prefix="/comparisons", tags=["Comparisons"])

# Future routers will be registered here:
# api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
# api_router.include_router(analysis_router, prefix="/analysis", tags=["Analysis"])
# api_router.include_router(comparison_router, prefix="/comparison", tags=["Comparison"])
# api_router.include_router(qa_router, prefix="/qa", tags=["Q&A"])

