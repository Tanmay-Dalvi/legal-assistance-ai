"""Document comparison API endpoints."""

from fastapi import APIRouter

from app.core.dependencies import DBSessionDep
from app.schemas.comparison import ComparisonRequest, ComparisonResponse
from app.services.comparison_service import ComparisonService

router = APIRouter()


def _response(comparison) -> ComparisonResponse:
    return ComparisonResponse(
        id=comparison.id,
        document_a_id=comparison.document_a_id,
        document_b_id=comparison.document_b_id,
        status=comparison.status,
        result=ComparisonService.result_from_record(comparison),
        error_message=comparison.error_message,
        created_at=comparison.created_at,
        completed_at=comparison.completed_at,
        updated_at=comparison.updated_at,
    )


@router.post("", response_model=ComparisonResponse, status_code=200)
async def create_comparison(
    request: ComparisonRequest, db: DBSessionDep
) -> ComparisonResponse:
    comparison = await ComparisonService(db).compare_documents(
        request.document_a_id, request.document_b_id
    )
    return _response(comparison)


@router.get("/{comparison_id}", response_model=ComparisonResponse)
async def get_comparison(comparison_id: str, db: DBSessionDep) -> ComparisonResponse:
    comparison = await ComparisonService(db).get_comparison(comparison_id)
    return _response(comparison)
