from typing import Any, Annotated, Self
from pydantic import Field, UUID7, model_validator
from collections.abc import Sequence
from fastapi import Query

from aoi.kit.schemas import Schema
from aoi.config import settings


class PaginationParams(Schema):
    after: UUID7 | None = Field(
        default=None,
        description="Cursor to be used with 'first' for forward pagination.",
    )
    before: UUID7 | None = Field(
        default=None,
        description="Cursor to be used with 'last' for backward pagination.",
    )
    first: int | None = Field(
        default=None,
        ge=1,
        le=settings.API_PAGINATION_MAX_LIMIT,
        description=(
            f"The number of items to forward paginate (used with 'after'). "
            f"Maximum is {settings.API_PAGINATION_MAX_LIMIT}."
        ),
    )
    last: int | None = Field(
        default=None,
        ge=1,
        le=settings.API_PAGINATION_MAX_LIMIT,
        description=(
            f"The number of items to backward paginate (used with 'before'). "
            f"Maximum is {settings.API_PAGINATION_MAX_LIMIT}."
        ),
    )

    @model_validator(mode="after")
    def check_cursor_order(self) -> Self:
        if not self.first and not self.last:
            raise ValueError("either 'first' or 'last' must be provided")

        if self.first and self.last:
            raise ValueError("'first' and 'last' cannot be both provided")

        if self.first and self.before:
            raise ValueError("'before' cannot be used with 'first'")

        if self.last and self.after:
            raise ValueError("'after' cannot be used with 'last'")

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
