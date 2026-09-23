"""knowledge graph tables

Entities and edges for the relational knowledge graph (docs/PLAN.md, stage 2).
An edge carries the manifest source id and locator it rests on, so retrieval
expansion can fetch exactly the provision the edge is evidence for.

Revision ID: a1c7f4e2b9d0
Revises: 890168d22a63
Create Date: 2026-09-22

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1c7f4e2b9d0"
down_revision: Union[str, Sequence[str], None] = "890168d22a63"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "kg_entity",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("key", sa.String(length=80), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("aliases", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ux_kg_entity_kind_key", "kg_entity", ["kind", "key"], unique=True)

    op.create_table(
        "kg_relation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("predicate", sa.String(length=60), nullable=False),
        sa.Column("object_id", sa.Integer(), nullable=False),
        sa.Column("cite_source_id", sa.String(length=60), nullable=True),
        sa.Column("cite_locator", sa.Text(), nullable=True),
        sa.Column("note", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["kg_entity.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["object_id"], ["kg_entity.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_kg_relation_subject", "kg_relation", ["subject_id"])
    op.create_index("ix_kg_relation_object", "kg_relation", ["object_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_kg_relation_object", table_name="kg_relation")
    op.drop_index("ix_kg_relation_subject", table_name="kg_relation")
    op.drop_table("kg_relation")
    op.drop_index("ux_kg_entity_kind_key", table_name="kg_entity")
    op.drop_table("kg_entity")
