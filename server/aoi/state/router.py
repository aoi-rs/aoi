from fastapi import Depends
from fastapi.routing import APIRouter

from aoi.state.schemas import DownloadedState
from aoi.state.service import state
from aoi.state.auth import StateRead
from aoi.postgres import AsyncSession, get_db_session

router = APIRouter(prefix="/state")


@router.get("/download")
async def download(
    auth_context: StateRead, session: AsyncSession = Depends(get_db_session)
) -> list[DownloadedState]:
    return await state.download(session, auth_context)


@router.get("/refresh")
async def refresh(
    from_revision: int,
    auth_context: StateRead,
    session: AsyncSession = Depends(get_db_session),
) -> list[DownloadedState]:
    return await state.refresh(session, auth_context, from_revision=from_revision)
