import structlog
import httpx

from abc import ABC, abstractmethod
from email_validator import validate_email
from typing import Any

from aoi.config import settings
from aoi.exceptions import AoiError
from aoi.logging import Logger
from aoi.enums import EmailSender as EmailSenderType

logger: Logger = structlog.get_logger()

DEFAULT_FROM_NAME = settings.EMAIL_FROM_NAME
DEFAULT_FROM_EMAIL_ADDRESS = f"{settings.EMAIL_FROM_LOCAL}@{settings.EMAIL_FROM_DOMAIN}"
DEFAULT_REPLY_TO_NAME = settings.EMAIL_DEFAULT_REPLY_TO_NAME
DEFAULT_REPLY_TO_EMAIL_ADDRESS = settings.EMAIL_DEFAULT_REPLY_TO_EMAIL_ADDRESS


def to_ascii_email(email: str) -> str:
    """
    Convert an email address to ASCII format, possibly using punycode for internationalized domains.
    """

    validated_email = validate_email(email, check_deliverability=False)
    return validated_email.ascii_email or email


class EmailSenderError(AoiError): ...


class EmailSender(ABC):
    @abstractmethod
    async def send(
        self,
        *,
        to_email_addr: str,
        subject: str,
        html_content: str,
        from_name: str = DEFAULT_FROM_NAME,
        from_email_addr: str = DEFAULT_FROM_EMAIL_ADDRESS,
        email_headers: dict[str, str] | None = None,
        reply_to_name: str = DEFAULT_REPLY_TO_NAME,
        reply_to_email_addr: str = DEFAULT_REPLY_TO_EMAIL_ADDRESS,
    ): ...


class LoggingEmailSender(EmailSender):
    async def send(
        self,
        *,
        to_email_addr: str,
        subject: str,
        html_content: str,
        from_name: str = DEFAULT_FROM_NAME,
        from_email_addr: str = DEFAULT_FROM_EMAIL_ADDRESS,
        email_headers: dict[str, str] | None = None,
        reply_to_name: str = DEFAULT_REPLY_TO_NAME,
        reply_to_email_addr: str = DEFAULT_REPLY_TO_EMAIL_ADDRESS,
    ):
        logger.info(
            "Sending an email",
            to_email_addr=to_ascii_email(to_email_addr),
            subject=subject,
            from_name=from_name,
            from_email_addr=to_ascii_email(from_email_addr),
        )


class ResendEmailSender(EmailSender):
    def __init__(self):
        self.client = httpx.AsyncClient(
            base_url=settings.RESEND_API_BASE_URL,
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        )

    async def send(
        self,
        *,
        to_email_addr: str,
        subject: str,
        html_content: str,
        from_name: str = DEFAULT_FROM_NAME,
        from_email_addr: str = DEFAULT_FROM_EMAIL_ADDRESS,
        email_headers: dict[str, str] | None = None,
        reply_to_name: str = DEFAULT_REPLY_TO_NAME,
        reply_to_email_addr: str = DEFAULT_REPLY_TO_EMAIL_ADDRESS,
    ):
        from_email_addr_ascii = to_ascii_email(from_email_addr)
        to_email_addr_ascii = to_ascii_email(to_email_addr)
        reply_to_email_addr_ascii = to_ascii_email(reply_to_email_addr)

        payload: dict[str, Any] = {
            "from": f"{from_name} <{from_email_addr_ascii}>",
            "to": [to_email_addr_ascii],
            "subject": subject,
            "html": html_content,
            "headers": email_headers or {},
            "reply_to": f"{reply_to_name} <{reply_to_email_addr_ascii}>",
        }

        try:
            response = await self.client.post("/emails", json=payload)
            response.raise_for_status()
            email = response.json()
        except httpx.RequestError as e:
            logger.warning(
                "resend.send_network_error",
                to_email_addr=to_email_addr_ascii,
                subject=subject,
                error=e,
            )

            raise EmailSenderError(str(e)) from e
        except httpx.HTTPError as e:
            logger.warning(
                "resend.send_error",
                to_email_addr=to_email_addr_ascii,
                subject=subject,
                error=e,
            )

            raise EmailSenderError(str(e)) from e

        logger.info(
            "resend.send",
            to_email_addr=to_email_addr_ascii,
            subject=subject,
            email_id=email["id"],
        )


email_sender: EmailSender

if settings.EMAIL_SENDER == EmailSenderType.resend:
    email_sender = ResendEmailSender()
else:
    email_sender = LoggingEmailSender()
