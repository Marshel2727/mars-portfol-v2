"""add featured project selection, ordering, and demo video

Revision ID: a3b5c7d9e1f2
Revises: f2a4c6e8b0d1
"""
from alembic import op
import sqlalchemy as sa

revision = 'a3b5c7d9e1f2'
down_revision = 'f2a4c6e8b0d1'
branch_labels = None
depends_on = None


def upgrade():
    columns = {column['name'] for column in sa.inspect(op.get_bind()).get_columns('projects')}
    with op.batch_alter_table('projects') as batch:
        if 'video_url' not in columns:
            batch.add_column(sa.Column('video_url', sa.String(500), nullable=True))
        if 'is_featured' not in columns:
            batch.add_column(sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'))
        if 'sort_order' not in columns:
            batch.add_column(sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    with op.batch_alter_table('projects') as batch:
        for name in ('sort_order', 'is_featured', 'video_url'):
            batch.drop_column(name)
