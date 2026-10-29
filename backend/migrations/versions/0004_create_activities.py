"""create activities, daily_activities, and activity_completions

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-28

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.core.activity_seed import SEED_ACTIVITIES

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "activities",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "daily_activities",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("activity_id", sa.Uuid(), nullable=False),
        sa.Column("activity_date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["activity_id"], ["activities.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "activity_date", name="uq_daily_activities_team_date"),
    )
    op.create_table(
        "activity_completions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("daily_activity_id", sa.Uuid(), nullable=False),
        sa.Column("outcome", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["daily_activity_id"], ["daily_activities.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "daily_activity_id",
            name="uq_activity_completions_user_assignment",
        ),
    )
    op.create_index("ix_activity_completions_user_id", "activity_completions", ["user_id"])
    op.create_index(
        "ix_activity_completions_daily_activity_id",
        "activity_completions",
        ["daily_activity_id"],
    )
    activities = sa.table(
        "activities",
        sa.column("id", sa.Uuid()),
        sa.column("title", sa.String()),
        sa.column("instructions", sa.Text()),
        sa.column("category", sa.String()),
        sa.column("estimated_minutes", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    seed_rows = [
        {
            "id": item["id"],
            "title": item["title"],
            "instructions": item["instructions"],
            "category": item["category"],
            "estimated_minutes": item["estimated_minutes"],
            "is_active": item["is_active"],
        }
        for item in SEED_ACTIVITIES
    ]
    op.bulk_insert(activities, seed_rows)


def downgrade() -> None:
    op.drop_index(
        "ix_activity_completions_daily_activity_id",
        table_name="activity_completions",
    )
    op.drop_index("ix_activity_completions_user_id", table_name="activity_completions")
    op.drop_table("activity_completions")
    op.drop_table("daily_activities")
    op.drop_table("activities")
