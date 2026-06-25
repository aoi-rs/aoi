from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from aoi.exceptions import AoiError


async def aoi_exception_handler(_: Request, exc: AoiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"status_code": exc.status_code, "message": exc.message},
    )


def add_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AoiError, aoi_exception_handler)  # type: ignore
