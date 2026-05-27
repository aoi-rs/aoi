from typing import Any, NamedTuple, Annotated
from pydantic import BaseModel
from collections.abc import Sequence
from fastapi import Query, Depends

from rinku.kit.schemas import Schema
from rinku.config import settings


class PaginationParams(NamedTuple):
    limit: int


async def get_pagination_params(
    limit: int = Query(
        10,
        description=(
            f"Size of a page, defaults to 10. "
            f"Maximum is {settings.API_PAGINATION_MAX_LIMIT}."
        ),
        gt=0,
    ),
) -> PaginationParams:
    return PaginationParams(min(settings.API_PAGINATION_MAX_LIMIT, limit))


PaginationParamsQuery = Annotated[PaginationParams, Depends(get_pagination_params)]


class Pagination(Schema):
    total_count: int


class ListResource[T: Any](BaseModel):
    items: list[T]
    pagination: Pagination

    @classmethod
    def from_paginated_results(cls, items: Sequence[T], total_count: int):
        return cls(items=list(items), pagination=Pagination(total_count=total_count))
