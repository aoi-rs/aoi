from typing import TypedDict

import httpx
from httpx_oauth.oauth2 import OAuth2Token
from httpx_oauth.clients.google import GoogleOAuth2

from rinku.exceptions import RinkuError
from rinku.postgres import AsyncSession
from rinku.users.repository import UserRepository
from rinku.users.oauth_service import oauth_accounts as oauth_account_service
from rinku.models.user import User, OAuthAccount, OAuthPlatform
from rinku.config import settings

google_oauth_client = GoogleOAuth2(
    settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET
)


class GoogleUserProfile(TypedDict):
    id: str
    email: str
    email_verified: bool
    picture: str | None


class GoogleServiceError(RinkuError): ...


class CannotLinkUnverifiedEmailError(GoogleServiceError):
    def __init__(self, email: str):
        message = (
            f"An account already exists on Rinku under the email {email}. "
            "We cannot automatically link it to your Google account since "
            "this email adress is not verified on Google. "
            "Either verify your email address on Google and try again "
            "or log in using your email."
        )

        super().__init__(message, status_code=403)


class AccountLinkedToAnotherUserError(GoogleServiceError):
    def __init__(self):
        message = (
            "This Google account is already linked to another user on Rinku. "
            "You may have already created another account "
            "with a different email address."
        )

        super().__init__(message, status_code=403)


class GoogleService:
    async def get_updated_or_create(
        self, session: AsyncSession, *, token: OAuth2Token
    ) -> tuple[User, bool]:
        google_profile = await self._get_profile(token["access_token"])
        user_repository = UserRepository.from_session(session)

        user = await user_repository.get_by_oauth_account(
            OAuthPlatform.google, google_profile["id"]
        )

        if user is not None:
            oauth_account = user.get_oauth_account(OAuthPlatform.google)
            assert oauth_account is not None

            oauth_account.access_token = token["access_token"]
            oauth_account.expires_at = token["expires_at"]
            oauth_account.account_username = google_profile["email"]

            session.add(oauth_account)
            return (user, False)

        oauth_account = OAuthAccount(
            platform=OAuthPlatform.google,
            account_id=google_profile["id"],
            account_email=google_profile["email"],
            account_username=google_profile["email"],
            access_token=token["access_token"],
            expires_at=token["expires_at"],
        )

        user = await user_repository.get_by_email(google_profile["email"])

        if user is not None:
            if google_profile["email_verified"]:
                user.oauth_accounts.append(oauth_account)
                session.add(user)
                return (user, False)
            else:
                raise CannotLinkUnverifiedEmailError(email=google_profile["email"])

        user = User(
            email=google_profile["email"],
            oauth_accounts=[oauth_account],
        )

        session.add(user)
        await session.flush()

        return (user, True)

    async def link_user(
        self, session: AsyncSession, *, user: User, token: OAuth2Token
    ) -> User:
        google_profile = await self._get_profile(token["access_token"])

        oauth_account = await oauth_account_service.get_by_platform_and_account_id(
            session, OAuthPlatform.google, google_profile["id"]
        )

        if oauth_account is not None:
            if oauth_account.user_id != user.id:
                raise AccountLinkedToAnotherUserError()
        else:
            oauth_account = OAuthAccount(
                platform=OAuthPlatform.google,
                account_id=google_profile["id"],
                account_email=google_profile["email"],
            )

            user.oauth_accounts.append(oauth_account)

        oauth_account.access_token = token["access_token"]
        oauth_account.expires_at = token["expires_at"]
        oauth_account.account_username = google_profile["email"]

        session.add(user)
        await session.flush()

        return user

    async def _get_profile(self, token: str) -> GoogleUserProfile:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )

            response.raise_for_status()
            data = response.json()

            return {
                "id": data["sub"],
                "email": data["email"],
                "email_verified": data["email_verified"],
                "picture": data.get("picture"),
            }


google = GoogleService()
