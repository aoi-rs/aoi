from fastapi import Request, APIRouter, Depends
from pydantic import UUID7

from rinku.kit.pagination import ListResource, PaginationParamsQuery
from rinku.exceptions import ResourceMissing
from rinku.postgres import AsyncSession, get_db_session
from rinku.sessions.schemas import SessionSchema, SessionRefresh
from rinku.auth.models import RequestContext
from rinku.auth.middlewares import authenticate_request
from rinku.sessions.service import sessions

router = APIRouter(prefix="/sessions")


@router.get("/", summary="List Sessions", response_model=ListResource[SessionSchema])
async def list(
    pagination: PaginationParamsQuery,
    context: RequestContext = Depends(authenticate_request),
    session: AsyncSession = Depends(get_db_session),
) -> ListResource[SessionSchema]:
    """
    Lists the currently active sessions.
    """

    items, count = await sessions.list(session, context, pagination=pagination)

    return ListResource[SessionSchema].from_paginated_results(
        [
            SessionSchema(
                id=item.id,
                user_id=item.user_id,
                user_agent=item.user_agent,
                refreshed_at=item.refreshed_at,
                revoked=item.revoked,
                is_current_session=item.id == context.session.id,
                created_at=item.created_at,
                modified_at=item.modified_at,
            )
            for item in items
        ],
        count,
    )


@router.delete(
    "/{id}/revoke",
    summary="Revoke Session",
    status_code=204,
    responses={204: {"description": "Session revoked."}},
)
async def revoke(
    id: UUID7,
    session: AsyncSession = Depends(get_db_session),
    context: RequestContext = Depends(authenticate_request),
):
    """
    Revokes a session.
    """

    user_session = await sessions.get(session, context, id)

    if user_session is None:
        raise ResourceMissing(message=f"The session '{id}' could not be found")

    await sessions.revoke(session, context, user_session)


@router.post(
    "/refresh",
    summary="Refresh Session",
    status_code=204,
    responses={
        204: {"description": "Session refreshed."},
    },
)
async def refresh(
    request: Request,
    params: SessionRefresh,
    session: AsyncSession = Depends(get_db_session),
):
    """
    Refreshes a session.
    """

    return await sessions.refresh(request, session, params)
