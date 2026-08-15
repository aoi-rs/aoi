from typing import Any, Annotated, Self
from pydantic import Field, UUID7, model_validator
from collections.abc import Sequence
from fastapi import Query

from aoi.kit.schemas import Schema
from aoi.config import settings


class PaginationParams(Schema):
    after: UUID7 | None = Field(
        default=None,
        description="Return resources that come after this resource ID.",
    )
    before: UUID7 | None = Field(
        default=None,
        description="Return resources that come before this resource ID.",
    )
    limit: int = Field(
        default=10,
        gt=0,
        le=settings.API_PAGINATION_MAX_LIMIT,
        description=(
            f"Size of a page, defaults to 10. "
            f"Maximum is {settings.API_PAGINATION_MAX_LIMIT}."
        ),
    )

    @model_validator(mode="after")
    def check_cursor_order(self) -> Self:
        if self.before and self.after and self.before >= self.after:
            raise ValueError("'before' must be less than 'after'")

        return self


PaginationParamsQuery = Annotated[PaginationParams, Query()]


class Pagination(Schema):
    total_count: int


class ListResource[T: Any](Schema):
    items: list[T]
    pagination: Pagination

    @classmethod
    def from_paginated_results(cls, items: Sequence[T], total_count: int):
        return cls(items=list(items), pagination=Pagination(total_count=total_count))
