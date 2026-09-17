"""corpus tables

Revision ID: dc41fc16185f
Revises: 
Create Date: 2026-09-17 19:49:18.028561

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'dc41fc16185f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table('sources',
    sa.Column('id', sa.String(length=120), nullable=False),
    sa.Column('title', sa.Text(), nullable=False),
    sa.Column('jurisdiction', sa.String(length=4), nullable=False),
    sa.Column('regime', postgresql.ARRAY(sa.String(length=40)), nullable=False),
    sa.Column('doc_type', sa.String(length=40), nullable=False),
    sa.Column('issuer', sa.Text(), nullable=False),
    sa.Column('url', sa.Text(), nullable=False),
    sa.Column('licence', sa.Text(), nullable=False),
    sa.Column('language', sa.String(length=12), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('source_versions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('source_id', sa.String(length=120), nullable=False),
    sa.Column('version_label', sa.Text(), nullable=False),
    sa.Column('sha256', sa.String(length=64), nullable=False),
    sa.Column('retrieved_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('effective_from', sa.Date(), nullable=True),
    sa.Column('effective_to', sa.Date(), nullable=True),
    sa.Column('superseded', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('sha256')
    )
    op.create_table('chunks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('source_version_id', sa.Integer(), nullable=False),
    sa.Column('locator', sa.Text(), nullable=False),
    sa.Column('heading_path', sa.Text(), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('context_header', sa.Text(), nullable=False),
    sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=1024), nullable=True),
    sa.Column('embed_model', sa.String(length=80), nullable=True),
    sa.Column('tsv', postgresql.TSVECTOR(), sa.Computed("to_tsvector('english', coalesce(context_header, '') || ' ' || text)", persisted=True), nullable=False),
    sa.Column('jurisdiction', sa.String(length=4), nullable=False),
    sa.Column('regime', postgresql.ARRAY(sa.String(length=40)), nullable=False),
    sa.Column('doc_type', sa.String(length=40), nullable=False),
    sa.ForeignKeyConstraint(['source_version_id'], ['source_versions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chunks_embedding_hnsw', 'chunks', ['embedding'], unique=False, postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.create_index('ix_chunks_jurisdiction_doc_type', 'chunks', ['jurisdiction', 'doc_type'], unique=False)
    op.create_index('ix_chunks_tsv', 'chunks', ['tsv'], unique=False, postgresql_using='gin')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_chunks_tsv', table_name='chunks', postgresql_using='gin')
    op.drop_index('ix_chunks_jurisdiction_doc_type', table_name='chunks')
    op.drop_index('ix_chunks_embedding_hnsw', table_name='chunks', postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.drop_table('chunks')
    op.drop_table('source_versions')
    op.drop_table('sources')
