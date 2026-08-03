from collections.abc import AsyncIterable

from fastapi import Depends
from fastapi.routing import APIRouter

from aoi.postgres import AsyncSession, get_db_session
from aoi.state.auth import StateRead
from aoi.state.schemas import DeltaStream
from aoi.state.service import state

router = APIRouter(prefix="/state")


@router.get("/", response_class=DeltaStream)
async def reconcile(
    auth_context: StateRead,
    session: AsyncSession = Depends(get_db_session),
    from_revision: int | None = None,
) -> AsyncIterable[str]:
    stream = (
        state.refresh(session, auth_context, from_revision=from_revision)
        if from_revision is not None
        else state.download(session, auth_context)
    )

    async for delta in stream:
        yield delta.model_dump_json() + "\n"
