import contextlib

from fastapi import FastAPI
from typing import TypedDict
from collections.abc import AsyncIterator

from rinku.kit.db.postgres import (AsyncEngine, AsyncSessionMaker, create_async_sessionmaker)
from rinku.postgres import (AsyncSessionMiddleware, create_async_engine)
from rinku.redis import Redis, create_redis
from rinku.router import router
from rinku.exception_handlers import add_exception_handlers
from rinku.auth.middlewares import RequestContextMiddleware

class State(TypedDict):
  async_engine: AsyncEngine
  async_sessionmaker: AsyncSessionMaker
  async_read_engine: AsyncEngine
  async_read_sessionmaker: AsyncSessionMaker
  redis: Redis

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[State]:
  async_engine = async_read_engine = create_async_engine("app")

  async_sessionmaker = async_read_sessionmaker = create_async_sessionmaker(async_engine)

  redis = create_redis("app")

  yield {
    "async_engine": async_engine,
    "async_sessionmaker": async_sessionmaker,
    "async_read_engine": async_read_engine,
    "async_read_sessionmaker": async_read_sessionmaker,
    "redis": redis
  }

  await redis.aclose(close_connection_pool=True)

  await async_engine.dispose()

  if async_read_engine is not async_engine:
    await async_read_engine.dispose()
  

rinku = FastAPI(lifespan=lifespan)

rinku.add_middleware(RequestContextMiddleware)
rinku.add_middleware(AsyncSessionMiddleware)

add_exception_handlers(rinku)

# /v1
rinku.include_router(router)
