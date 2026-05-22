from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from rinku.exceptions  import RinkuError

async def rinku_exception_handler(_: Request, exc: RinkuError) -> JSONResponse:
  return JSONResponse(
    status_code=exc.status_code,
    content={"status_code": exc.status_code, "message": exc.message},
  )

def add_exception_handlers(app: FastAPI) -> None:
  app.add_exception_handler(RinkuError, rinku_exception_handler)
