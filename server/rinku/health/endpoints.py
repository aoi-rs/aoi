from fastapi import Depends, HTTPException
from fastapi.routing import APIRouter
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from redis import RedisError

from rinku.postgres import AsyncSession, get_db_session
from rinku.redis import Redis, get_redis


router = APIRouter(tags=["health"], include_in_schema=False)

@router.get("/healthz")
async def healthz(
  session: AsyncSession = Depends(get_db_session), 
  redis: Redis = Depends(get_redis),
):
  try:
    await session.execute(select(1))
  except SQLAlchemyError as e:
    raise HTTPException(status_code=503, detail="Postgres is not available") from e
  
  try:
    await redis.ping()
  except RedisError as e:
    raise HTTPException(status_code=503, detail="Redis is not available") from e
  
  return {"status": "ok"}

