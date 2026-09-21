"""Document analysis API endpoints."""

from fastapi import APIRouter

from app.core.dependencies import DBSessionDep
from app.schemas.analysis import AnalysisResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()


def _response(analysis) -> AnalysisResponse:
    result = AnalysisService._result_from_record(analysis)
    return AnalysisResponse(
        id=analysis.id,
        document_id=analysis.document_id,
        status=analysis.status,
        result=result,
        error_message=analysis.error_message,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
    )


@router.post(
    "/{document_id}/analyze",
    response_model=AnalysisResponse,
    status_code=200,
    summary="Analyze a ready document",
)
async def analyze_document(document_id: str, db: DBSessionDep) -> AnalysisResponse:
    analysis = await AnalysisService(db).analyze_document(document_id)
    return _response(analysis)


@router.get(
    "/{document_id}/analysis",
    response_model=AnalysisResponse,
    summary="Get document analysis",
)
async def get_analysis(document_id: str, db: DBSessionDep) -> AnalysisResponse:
    analysis = await AnalysisService(db).get_analysis(document_id)
    return _response(analysis)
