"""assistant tables

Revision ID: 890168d22a63
Revises: 969153d67b6d
Create Date: 2026-09-17 20:25:48.937798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '890168d22a63'
down_revision: Union[str, Sequence[str], None] = '969153d67b6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('answers',
    sa.Column('id', sa.String(length=40), nullable=False),
    sa.Column('session_id', sa.String(length=64), nullable=False),
    sa.Column('envelope', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_answers_session_id'), 'answers', ['session_id'], unique=False)
    op.create_table('audit_events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.String(length=64), nullable=False),
    sa.Column('kind', sa.String(length=40), nullable=False),
    sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_events_session_id'), 'audit_events', ['session_id'], unique=False)
    op.create_table('consent_grants',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.String(length=64), nullable=False),
    sa.Column('scope', sa.String(length=80), nullable=False),
    sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consent_grants_session_id'), 'consent_grants', ['session_id'], unique=False)
    op.create_table('facilitators',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('contact', sa.Text(), nullable=False),
    sa.Column('source_url', sa.Text(), nullable=False),
    sa.Column('verified_at', sa.Date(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('material_ipr',
    sa.Column('kind', sa.String(length=10), nullable=False),
    sa.Column('material_id', sa.String(length=60), nullable=False),
    sa.Column('profile', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('last_verified', sa.Date(), nullable=True),
    sa.PrimaryKeyConstraint('kind', 'material_id')
    )
    op.create_table('escalations',
    sa.Column('id', sa.String(length=40), nullable=False),
    sa.Column('session_id', sa.String(length=64), nullable=False),
    sa.Column('answer_id', sa.String(length=40), nullable=True),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('contact', sa.Text(), nullable=True),
    sa.Column('facilitator_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['facilitator_id'], ['facilitators.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_escalations_session_id'), 'escalations', ['session_id'], unique=False)
    op.create_table('registries',
    sa.Column('id', sa.String(length=60), nullable=False),
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('jurisdiction', sa.String(length=4), nullable=False),
    sa.Column('regime', postgresql.ARRAY(sa.String(length=40)), nullable=False),
    sa.Column('url', sa.Text(), nullable=False),
    sa.Column('forms', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('fee_note', sa.Text(), nullable=True),
    sa.Column('cite_chunk_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['cite_chunk_id'], ['chunks.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('registries')
    op.drop_index(op.f('ix_escalations_session_id'), table_name='escalations')
    op.drop_table('escalations')
    op.drop_table('material_ipr')
    op.drop_table('facilitators')
    op.drop_index(op.f('ix_consent_grants_session_id'), table_name='consent_grants')
    op.drop_table('consent_grants')
    op.drop_index(op.f('ix_audit_events_session_id'), table_name='audit_events')
    op.drop_table('audit_events')
    op.drop_index(op.f('ix_answers_session_id'), table_name='answers')
    op.drop_table('answers')
