import uuid
from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import MAX_ACTIVITY_TITLE_LENGTH
from app.core.timezones import utc_now
from app.models.base import Base, str_enum_column
from app.models.team import Team
from app.models.user import User


class ActivityCategory(StrEnum):
    ICEBREAKER = "icebreaker"
    REFLECTION = "reflection"
    APPRECIATION = "appreciation"
    FUN = "fun"


class CompletionOutcome(StrEnum):
    COMPLETED = "completed"
    SKIPPED = "skipped"


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(MAX_ACTIVITY_TITLE_LENGTH), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[ActivityCategory] = mapped_column(
        str_enum_column(ActivityCategory, length=32),
        nullable=False,
    )
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )


class DailyActivity(Base):
    __tablename__ = "daily_activities"
    __table_args__ = (
        UniqueConstraint("team_id", "activity_date", name="uq_daily_activities_team_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False)
    activity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("activities.id"), nullable=False)
    activity_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    team: Mapped[Team] = relationship(lazy="raise")
    activity: Mapped[Activity] = relationship(lazy="raise")


class ActivityCompletion(Base):
    __tablename__ = "activity_completions"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "daily_activity_id",
            name="uq_activity_completions_user_assignment",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    daily_activity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("daily_activities.id"),
        index=True,
        nullable=False,
    )
    outcome: Mapped[CompletionOutcome] = mapped_column(
        str_enum_column(CompletionOutcome, length=32),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    user: Mapped[User] = relationship(lazy="raise")
    daily_activity: Mapped[DailyActivity] = relationship(lazy="raise")
