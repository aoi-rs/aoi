import os

from enum import StrEnum
from datetime import timedelta
from typing import Literal

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

from rinku.enums import EmailSender


class Environment(StrEnum):
    development = "development"
    production = "production"
    test = "test"


env = Environment(os.getenv("RINKU_ENV", Environment.development))

if env == Environment.test:
    env_file = ".env.test"
else:
    env_file = ".env"

class Settings(BaseSettings):
    ENV: Environment = Environment.development
    SECRET: str = "secret"
    SQLALCHEMY_DEBUG: bool = False

    # Database
    POSTGRES_USER: str = "rinku"
    POSTGRES_PWD: str = "rinku"
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_DATABASE: str = "rinku"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_POOL_RECYCLE_SECONDS: int = 600  # 10 minutes
    DATABASE_COMMAND_TIMEOUT_SECONDS: float = 30.0
    DATABASE_STREAM_YIELD_PER: int = 100

    POSTGRES_READ_USER: str | None = None
    POSTGRES_READ_PWD: str | None = None
    POSTGRES_READ_HOST: str | None = None
    POSTGRES_READ_PORT: int | None = None
    POSTGRES_READ_DATABASE: str | None = None

    # Redis
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Emails
    EMAIL_SENDER: EmailSender = EmailSender.logger
    EMAIL_FROM_NAME: str = "Rinku"
    EMAIL_FROM_DOMAIN: str = "notifications.rinku.sh"
    EMAIL_FROM_LOCAL: str = "mail"
    EMAIL_DEFAULT_REPLY_TO_NAME: str = "Rinku Support"
    EMAIL_DEFAULT_REPLY_TO_EMAIL_ADDRESS: str = "support@rinku.sh"

    # Resend
    RESEND_API_KEY: str = ""
    RESEND_API_BASE_URL: str = "https://api.resend.com"

    # Login tokens
    LOGIN_TOKEN_LENGTH: int = 6
    LOGIN_TOKEN_TTL_SECONDS: int = 600  # 10 minutes

    # Links
    SLUG_ALPHABET: str = (
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    )

    # OAuth state
    OAUTH_STATE_TTL: timedelta = timedelta(minutes=10)
    OAUTH_STATE_COOKIE_KEY: str = "rinku_oauth_state"

    # Sessions
    ACCESS_TOKEN_COOKIE_KEY: str = "rinku_access_token"
    REFRESH_TOKEN_COOKIE_KEY: str = "rinku_refresh_token"
    REFRESH_TOKEN_REUSE_INTERVAL_SECONDS: int = 10
    REFRESH_TOKEN_ROTATION_ENABLED: bool = True
    SESSION_COOKIE_DOMAIN: str = "127.0.0.1"

    # Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # AWS (DynamoDB)
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"

    # DynamoDB
    # Remember to set to http://127.0.0.1:8080 during development
    DYNAMODB_ENDPOINT_URL: str | None = None

    # JWTs
    JWT_PRIVATE_KEY: str = "secret"

    # Pagination
    API_PAGINATION_MAX_LIMIT: int = 100

    ALLOWED_HOSTS: set[str] = {"127.0.0.1:3000", "localhost:3000"}
    FRONTEND_BASE_URL: str = "http://127.0.0.1:3000"
    FRONTEND_DEFAULT_RETURN_PATH: str = "/"

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    model_config = SettingsConfigDict(
        env_prefix="rinku_",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_file=env_file,
        extra="allow",
    )

    def get_postgres_dsn(self, driver: Literal["asyncpg", "psycopg2"]) -> str:
        return str(
            PostgresDsn.build(
                scheme=f"postgresql+{driver}",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PWD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DATABASE,
            )
        )

    def is_read_replica_configured(self) -> bool:
        return all(
            [
                self.POSTGRES_READ_USER,
                self.POSTGRES_READ_PWD,
                self.POSTGRES_READ_HOST,
                self.POSTGRES_READ_PORT,
                self.POSTGRES_READ_DATABASE,
            ]
        )

    def get_postgres_read_dsn(
        self, driver: Literal["asyncpg", "psycopg2"]
    ) -> str | None:
        if not self.is_read_replica_configured():
            return None

        return str(
            PostgresDsn.build(
                scheme=f"postgresql+{driver}",
                username=self.POSTGRES_READ_USER,
                password=self.POSTGRES_READ_PWD,
                host=self.POSTGRES_READ_HOST,
                port=self.POSTGRES_READ_PORT,
                path=self.POSTGRES_READ_DATABASE,
            )
        )

    def generate_frontend_url(self, path: str) -> str:
        return f"{self.FRONTEND_BASE_URL}{path}"

    def is_environment(self, environments: set[Environment]) -> bool:
        return self.ENV in environments

    def is_development(self) -> bool:
        return self.is_environment({Environment.development})

    def is_production(self) -> bool:
        return self.is_environment({Environment.production})

    def is_test(self) -> bool:
        return self.is_environment({Environment.test})


settings = Settings()
