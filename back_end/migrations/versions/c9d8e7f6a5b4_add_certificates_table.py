"""add certificates table

Revision ID: c9d8e7f6a5b4
Revises: a3b5c7d9e1f2
"""

from alembic import op
import sqlalchemy as sa


revision = 'c9d8e7f6a5b4'
down_revision = 'a3b5c7d9e1f2'
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table('certificates'):
        op.create_table(
            'certificates',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('issuer', sa.String(length=150), nullable=False),
            sa.Column('issue_date', sa.String(length=50), nullable=True),
            sa.Column('category', sa.String(length=100), nullable=False, server_default='Lainnya'),
            sa.Column('credential_id', sa.String(length=120), nullable=True),
            sa.Column('credential_url', sa.String(length=500), nullable=True),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('file_url', sa.String(length=255), nullable=False),
            sa.Column('file_type', sa.String(length=20), nullable=False, server_default='image'),
            sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
        )


def downgrade():
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table('certificates'):
        op.drop_table('certificates')
