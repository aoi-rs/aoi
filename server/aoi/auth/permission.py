from enum import StrEnum


class Permission(StrEnum):
    user_read = "user_read"
    user_write = "user_write"

    sessions_read = "sessions_read"
    sessions_write = "sessions_write"

    personal_access_tokens_read = "personal_access_tokens_read"
    personal_access_tokens_write = "personal_access_tokens_write"

    links_read = "links_read"
    links_write = "links_write"
