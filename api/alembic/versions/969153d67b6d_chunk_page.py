"""chunk page

Revision ID: 969153d67b6d
Revises: dc41fc16185f
Create Date: 2026-09-17 20:15:21.393652

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '969153d67b6d'
down_revision: Union[str, Sequence[str], None] = 'dc41fc16185f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('chunks', sa.Column('page', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('chunks', 'page')
