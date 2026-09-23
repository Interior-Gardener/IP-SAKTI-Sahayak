"""registry action and forms note

The registry seed (app/registry) says what a person does at each registry, and
says so plainly when the corpus does not name the form. Two nullable columns,
so existing rows are untouched.

Revision ID: b2d8e5f1c3a4
Revises: a1c7f4e2b9d0
Create Date: 2026-09-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2d8e5f1c3a4"
down_revision: Union[str, Sequence[str], None] = "a1c7f4e2b9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("registries", sa.Column("action", sa.Text(), nullable=True))
    op.add_column("registries", sa.Column("forms_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("registries", "forms_note")
    op.drop_column("registries", "action")
