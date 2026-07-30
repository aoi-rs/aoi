"""add revision to users

Revision ID: 23c4dc3c61c1
Revises: e2e683bfd9e6
Create Date: 2026-07-30 10:43:45.867230

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "23c4dc3c61c1"
down_revision: Union[str, Sequence[str], None] = "e2e683bfd9e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE SEQUENCE revision_number
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 100
    """)

    op.add_column(
        "users",
        sa.Column(
            "revision",
            sa.BIGINT(),
            server_default=sa.text("nextval('revision_number')"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.execute("DROP SEQUENCE revision_number")
    op.drop_column("users", "revision")
