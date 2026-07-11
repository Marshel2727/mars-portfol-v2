"""add project tags, categories, and project skill links

Revision ID: d8c3f19a4e72
Revises: a7e8f9d0c1b2
Create Date: 2026-07-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd8c3f19a4e72'
down_revision = 'a7e8f9d0c1b2'
branch_labels = None
depends_on = None


def _has_column(table_name, column_name):
    inspector = sa.inspect(op.get_bind())
    return any(
        column['name'] == column_name
        for column in inspector.get_columns(table_name)
    )


def _has_table(table_name):
    return table_name in sa.inspect(op.get_bind()).get_table_names()


def upgrade():
    if not _has_column('projects', 'category'):
        op.add_column(
            'projects',
            sa.Column('category', sa.String(length=100), nullable=False, server_default='Lainnya')
        )
    if not _has_column('projects', 'tech_tags'):
        op.add_column('projects', sa.Column('tech_tags', sa.JSON(), nullable=True))
        op.execute("UPDATE projects SET tech_tags = JSON_ARRAY() WHERE tech_tags IS NULL")
        op.alter_column('projects', 'tech_tags', existing_type=sa.JSON(), nullable=False)
    if not _has_column('skills', 'category'):
        op.add_column(
            'skills',
            sa.Column('category', sa.String(length=100), nullable=False, server_default='Lainnya')
        )

    if not _has_table('project_skills'):
        op.create_table(
            'project_skills',
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('skill_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('project_id', 'skill_id')
        )


def downgrade():
    if _has_table('project_skills'):
        op.drop_table('project_skills')
    if _has_column('skills', 'category'):
        op.drop_column('skills', 'category')
    if _has_column('projects', 'tech_tags'):
        op.drop_column('projects', 'tech_tags')
    if _has_column('projects', 'category'):
        op.drop_column('projects', 'category')
