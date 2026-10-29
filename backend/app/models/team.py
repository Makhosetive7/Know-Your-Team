from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import MAX_TEAM_NAME_LENGTH, MAX_TIMEZONE_LENGTH
from app.core.timezones import utc_now
from app.models.base import Base, str_enum_column
from app.models.user import User


class MembershipRole(StrEnum):
    MEMBER = "member"
    TEAM_ADMINISTRATOR = "team_administrator"


class MembershipStatus(StrEnum):
    ACTIVE = "active"
    LEFT = "left"
    REMOVED = "removed"


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(MAX_TEAM_NAME_LENGTH), nullable=False)
    timezone: Mapped[str] = mapped_column(String(MAX_TIMEZONE_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    memberships: Mapped[list[TeamMembership]] = relationship(
        back_populates="team",
        lazy="raise",
    )


class TeamMembership(Base):
    __tablename__ = "team_memberships"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_memberships_team_user"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    role: Mapped[MembershipRole] = mapped_column(
        str_enum_column(MembershipRole, length=32),
        nullable=False,
    )
    status: Mapped[MembershipStatus] = mapped_column(
        str_enum_column(MembershipStatus, length=32),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    team: Mapped[Team] = relationship(back_populates="memberships", lazy="raise")
    user: Mapped[User] = relationship(lazy="raise")
