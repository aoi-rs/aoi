from fastapi import Request, APIRouter, Depends
from pydantic import UUID7

from aoi.kit.pagination import ListResource, PaginationParamsQuery
from aoi.exceptions import ResourceMissing
from aoi.postgres import AsyncSession, get_db_session
from aoi.sessions.schemas import SessionSchema, SessionRefresh
from aoi.sessions.auth import SessionsRead, SessionsWrite
from aoi.sessions.service import sessions
from aoi.auth.dependencies import WebSession
from aoi.auth.models import is_user_session

router = APIRouter(prefix="/sessions")


@router.get("/", summary="List Sessions", response_model=ListResource[SessionSchema])
async def list(
    pagination: PaginationParamsQuery,
    auth_context: SessionsRead,
    session: AsyncSession = Depends(get_db_session),
) -> ListResource[SessionSchema]:
    """
    Lists the currently active sessions.
    """

    items, count = await sessions.list(session, auth_context, pagination=pagination)

    return ListResource[SessionSchema].from_paginated_results(
        [
            SessionSchema(
                id=item.id,
                user_id=item.user_id,
                user_agent=item.user_agent,
                name=item.name,
                refreshed_at=item.refreshed_at,
                revoked=item.revoked,
                is_current_session=item.id == auth_context.session.id
                if is_user_session(auth_context.session)
                else False,
                created_at=item.created_at,
                modified_at=item.modified_at,
            )
            for item in items
        ],
        count,
    )


@router.delete(
    "/others",
    summary="Revoke Other Sessions",
    status_code=204,
    responses={204: {"description": "Sessions revoked."}},
)
async def revoke_others(
    auth_context: WebSession, session: AsyncSession = Depends(get_db_session)
):
    """
    Revokes all of user's sessions excluding the current one.
    """

    await sessions.revoke_others(session, auth_context)


@router.delete(
    "/{id}",
    summary="Revoke Session",
    status_code=204,
    responses={204: {"description": "Session revoked."}},
)
async def revoke(
    id: UUID7,
    auth_context: SessionsWrite,
    session: AsyncSession = Depends(get_db_session),
):
    """
    Revokes a session.
    """

    user_session = await sessions.get(session, auth_context, id)

    if user_session is None:
        raise ResourceMissing(message=f"The session '{id}' could not be found")

    await sessions.revoke(session, user_session)


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
