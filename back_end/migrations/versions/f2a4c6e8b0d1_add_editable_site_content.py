"""add editable site content and public presentation fields

Revision ID: f2a4c6e8b0d1
Revises: e5a91c7b2d40
"""

from alembic import op
import sqlalchemy as sa


revision = 'f2a4c6e8b0d1'
down_revision = 'e5a91c7b2d40'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table('site_contents'):
        op.create_table(
            'site_contents',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('content', sa.JSON(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
        )

    skill_columns = {column['name'] for column in sa.inspect(bind).get_columns('skills')}
    with op.batch_alter_table('skills') as batch_op:
        if 'detail' not in skill_columns:
            batch_op.add_column(sa.Column('detail', sa.String(length=180), nullable=True))
        if 'proficiency' not in skill_columns:
            batch_op.add_column(sa.Column('proficiency', sa.Integer(), nullable=True))
        if 'years_experience' not in skill_columns:
            batch_op.add_column(sa.Column('years_experience', sa.String(length=50), nullable=True))
        if 'display_order' not in skill_columns:
            batch_op.add_column(sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))

    project_columns = {column['name'] for column in sa.inspect(bind).get_columns('projects')}
    if 'architecture_steps' not in project_columns:
        with op.batch_alter_table('projects') as batch_op:
            # Nullable during migration keeps existing project rows valid. The
            # model supplies [] for all new writes and serialization normalizes NULL.
            batch_op.add_column(sa.Column('architecture_steps', sa.JSON(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    project_columns = {column['name'] for column in inspector.get_columns('projects')}
    if 'architecture_steps' in project_columns:
        with op.batch_alter_table('projects') as batch_op:
            batch_op.drop_column('architecture_steps')

    skill_columns = {column['name'] for column in sa.inspect(bind).get_columns('skills')}
    with op.batch_alter_table('skills') as batch_op:
        for column_name in ('display_order', 'years_experience', 'proficiency', 'detail'):
            if column_name in skill_columns:
                batch_op.drop_column(column_name)

    if sa.inspect(bind).has_table('site_contents'):
        op.drop_table('site_contents')
