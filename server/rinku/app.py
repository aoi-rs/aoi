import contextlib

from fastapi import FastAPI
from typing import TypedDict
from collections.abc import AsyncIterator
from starlette.types import Scope

from rinku.postgres import AsyncSessionMiddleware, create_async_engine
from rinku.redis import Redis, create_redis
from rinku.router import router
from rinku.health.router import router as health_router
from rinku.exception_handlers import add_exception_handlers
from rinku.kit.cors import CORSConfig, CORSMatcherMiddleware
from rinku.config import settings

from rinku.kit.db.postgres import (
    AsyncEngine,
    AsyncSessionMaker,
    create_async_sessionmaker,
)


def configure_cors(app: FastAPI):
    configs: list[CORSConfig] = []

    # Asahi frontend CORS configuration
    if settings.CORS_ORIGINS:

        def asahi_frontend_matcher(origin: str, scope: Scope) -> bool:
            return origin in settings.CORS_ORIGINS

        asahi_frontend_config = CORSConfig(
            asahi_frontend_matcher,
            allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        configs.append(asahi_frontend_config)

    service_config = CORSConfig(
        lambda origin, scope: True,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["Authorization"],
    )

    configs.append(service_config)

    app.add_middleware(CORSMatcherMiddleware, configs=configs)


class State(TypedDict):
    async_engine: AsyncEngine
    async_sessionmaker: AsyncSessionMaker
    async_read_engine: AsyncEngine
    async_read_sessionmaker: AsyncSessionMaker
    redis: Redis


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[State]:
    async_engine = async_read_engine = create_async_engine("app")

    async_sessionmaker = async_read_sessionmaker = create_async_sessionmaker(
        async_engine
    )

    redis = create_redis("app")

    yield {
        "async_engine": async_engine,
        "async_sessionmaker": async_sessionmaker,
        "async_read_engine": async_read_engine,
        "async_read_sessionmaker": async_read_sessionmaker,
        "redis": redis,
    }

    await redis.close(close_connection_pool=True)

    await async_engine.dispose()

    if async_read_engine is not async_engine:
        await async_read_engine.dispose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(AsyncSessionMiddleware)

configure_cors(app)
add_exception_handlers(app)

# /healthz
app.include_router(health_router)

# /v1
app.include_router(router)
