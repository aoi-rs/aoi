from fastapi import Depends
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse

import json
from typing import Any, AsyncGenerator

from aoi.state.service import state
from aoi.state.auth import StateRead
from aoi.postgres import AsyncSession, get_db_session

router = APIRouter(prefix="/state")


async def from_generator(generator: AsyncGenerator[Any]):
    async for item in generator:
        yield json.dumps(item) + "\n"


@router.get("/download")
async def download(
    auth_context: StateRead, session: AsyncSession = Depends(get_db_session)
) -> StreamingResponse:
    return StreamingResponse(
        from_generator(state.download(session, auth_context)),
        media_type="application/x-ndjson",
    )


@router.get("/refresh")
async def refresh(
    from_revision: int,
    auth_context: StateRead,
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    return StreamingResponse(
        from_generator(
            state.refresh(session, auth_context, from_revision=from_revision)
        ),
        media_type="application/x-ndjson",
    )
