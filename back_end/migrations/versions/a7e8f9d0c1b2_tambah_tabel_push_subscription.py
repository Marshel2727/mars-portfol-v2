"""tambah tabel push_subscription

Revision ID: a7e8f9d0c1b2
Revises: b6f2d0e9a1c3
Create Date: 2026-06-08 20:12:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a7e8f9d0c1b2'
down_revision = 'b6f2d0e9a1c3'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('subscription_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('push_subscriptions')
