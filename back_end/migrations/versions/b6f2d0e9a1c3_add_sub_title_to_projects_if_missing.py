"""add sub_title to projects if missing

Revision ID: b6f2d0e9a1c3
Revises: 79182fa845db
Create Date: 2026-05-03 15:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b6f2d0e9a1c3'
down_revision = '79182fa845db'
branch_labels = None
depends_on = None


def _has_column(table_name, column_name):
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(
        column['name'] == column_name
        for column in inspector.get_columns(table_name)
    )


def upgrade():
    if not _has_column('projects', 'sub_title'):
        op.add_column('projects', sa.Column('sub_title', sa.String(length=150), nullable=True))


def downgrade():
    if _has_column('projects', 'sub_title'):
        op.drop_column('projects', 'sub_title')
