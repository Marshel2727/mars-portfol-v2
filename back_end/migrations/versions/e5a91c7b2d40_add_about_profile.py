"""add about profile

Revision ID: e5a91c7b2d40
Revises: d8c3f19a4e72
Create Date: 2026-07-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e5a91c7b2d40'
down_revision = 'd8c3f19a4e72'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'about_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=120), nullable=False),
        sa.Column('headline', sa.String(length=180), nullable=False),
        sa.Column('bio', sa.Text(), nullable=False),
        sa.Column('education', sa.String(length=180), nullable=True),
        sa.Column('location', sa.String(length=120), nullable=True),
        sa.Column('current_focus', sa.Text(), nullable=True),
        sa.Column('cv_url', sa.String(length=255), nullable=True),
        sa.Column('profile_image_url', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    about_profiles = sa.table(
        'about_profiles',
        sa.column('id', sa.Integer()),
        sa.column('full_name', sa.String()),
        sa.column('headline', sa.String()),
        sa.column('bio', sa.Text()),
        sa.column('education', sa.String()),
        sa.column('location', sa.String()),
        sa.column('current_focus', sa.Text()),
    )
    op.bulk_insert(about_profiles, [{
        'id': 1,
        'full_name': 'Marshel',
        'headline': 'Full-Stack Developer & IoT Enthusiast',
        'bio': (
            'Saya adalah mahasiswa Teknik Komputer yang menikmati proses mengubah '
            'kebutuhan nyata menjadi aplikasi yang dapat digunakan. Saya terbiasa '
            'mengerjakan antarmuka, backend, database, deployment, hingga integrasi perangkat IoT.'
        ),
        'education': 'Mahasiswa Teknik Komputer',
        'location': 'Indonesia',
        'current_focus': (
            'Memperkuat kemampuan full-stack development dan membangun sistem yang '
            'stabil, mudah dipelihara, serta relevan bagi penggunanya.'
        ),
    }])


def downgrade():
    op.drop_table('about_profiles')
