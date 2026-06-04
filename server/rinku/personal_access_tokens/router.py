from fastapi import APIRouter, Depends
from pydantic import UUID7

from rinku.postgres import AsyncSession, get_db_session
from rinku.exceptions import ResourceMissing
from rinku.kit.pagination import ListResource, PaginationParamsQuery

from .auth import PersonalAccessTokensRead, PersonalAccessTokensWrite
from .service import personal_access_tokens

from .schemas import (
    PersonalAccessTokenCreate,
    PersonalAccessTokenCreateResponse,
    PersonalAccessTokenUpdate,
    PersonalAccessTokenSchema,
)

router = APIRouter(prefix="/personal_access_tokens")


@router.get("/", response_model=ListResource[PersonalAccessTokenSchema])
async def list(
    pagination: PaginationParamsQuery,
    auth_context: PersonalAccessTokensRead,
    session: AsyncSession = Depends(get_db_session),
) -> ListResource[PersonalAccessTokenSchema]:
    items, count = await personal_access_tokens.list(
        session, auth_context, pagination=pagination
    )

    return ListResource[PersonalAccessTokenSchema].from_paginated_results(
        [PersonalAccessTokenSchema.model_validate(item) for item in items], count
    )


@router.post("/", response_model=PersonalAccessTokenCreateResponse, status_code=201)
async def create(
    personal_access_token_create: PersonalAccessTokenCreate,
    auth_context: PersonalAccessTokensWrite,
    session: AsyncSession = Depends(get_db_session),
) -> PersonalAccessTokenCreateResponse:
    personal_access_token, token = await personal_access_tokens.create(
        session, auth_context, create_schema=personal_access_token_create
    )

    return PersonalAccessTokenCreateResponse.model_validate(
        {"token": token, "personal_access_token": personal_access_token}
    )


@router.patch("/{id}", response_model=PersonalAccessTokenSchema, status_code=200)
async def update(
    id: UUID7,
    personal_access_token_update: PersonalAccessTokenUpdate,
    auth_context: PersonalAccessTokensWrite,
    session: AsyncSession = Depends(get_db_session),
) -> PersonalAccessTokenSchema:
    personal_access_token = await personal_access_tokens.get(session, auth_context, id)

    if personal_access_token is None:
        raise ResourceMissing(
            message=f"The personal access token '{id}' could not be found"
        )

    personal_access_token = await personal_access_tokens.update(
        session, personal_access_token, update_schema=personal_access_token_update
    )

    return PersonalAccessTokenSchema.model_validate(personal_access_token)


@router.delete(
    "/{id}/revoke",
    summary="Revoke personal access token",
    status_code=204,
    responses={204: {"description": "Personal access token revoked."}},
)
async def revoke(
    id: UUID7,
    auth_context: PersonalAccessTokensWrite,
    session: AsyncSession = Depends(get_db_session),
):
    personal_access_token = await personal_access_tokens.get(session, auth_context, id)

    if personal_access_token is None:
        raise ResourceMissing(
            message=f"The personal access token '{id}' could not be found"
        )

    await personal_access_tokens.revoke(session, personal_access_token)
