"""Local demo accounts for trying invite links and team participation.

Passwords come from the environment. This module does not embed credentials.
"""

import asyncio
import logging
import os
import sys
import uuid
from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import quote

from fastapi_users.password import PasswordHelper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import get_clock
from app.core.config import DEFAULT_INVITATION_TTL_DAYS, MIN_PASSWORD_LENGTH
from app.core.timezones import parse_timezone
from app.core.tokens import hash_invitation_token, new_invitation_token
from app.models import Team, User
from app.models.team import MembershipRole, MembershipStatus
from app.repositories.activity import (
    ActivityRepository,
    AssignmentRepository,
    CompletionRepository,
)
from app.repositories.invitation import InvitationRepository
from app.repositories.team import TeamRepository
from app.services.daily_activity import DailyActivityService
from app.services.progress import ProgressService
from app.services.team import TeamService

logger = logging.getLogger(__name__)

PLATFORM_ADMIN_EMAIL = "platform@example.com"
TEAM_ADMIN_EMAIL = "ada@example.com"
TEAM_MEMBER_EMAIL = "grace@example.com"
INVITEE_EMAIL = "nia@example.com"
DEMO_TEAM_NAME = "Studio"
DEMO_TEAM_TIMEZONE = "Europe/Amsterdam"

_password_helper = PasswordHelper()


@dataclass(frozen=True)
class _DemoAccount:
    email: str
    display_name: str
    is_superuser: bool


_ACCOUNTS: tuple[_DemoAccount, ...] = (
    _DemoAccount(PLATFORM_ADMIN_EMAIL, "Platform", True),
    _DemoAccount(TEAM_ADMIN_EMAIL, "Ada", False),
    _DemoAccount(TEAM_MEMBER_EMAIL, "Grace", False),
    _DemoAccount(INVITEE_EMAIL, "Nia", False),
)

DEMO_ACCOUNT_NOTES: tuple[str, ...] = (
    f"{PLATFORM_ADMIN_EMAIL} — platform administrator (activity library)",
    f"{TEAM_ADMIN_EMAIL} — team administrator of {DEMO_TEAM_NAME}",
    f"{TEAM_MEMBER_EMAIL} — member of {DEMO_TEAM_NAME} who completed today",
    f"{INVITEE_EMAIL} — registered, not on the team yet",
)


@dataclass(frozen=True)
class DemoSeedResult:
    team_id: uuid.UUID
    team_name: str
    invite_token: str
    invite_path: str
    member_count: int
    completed_count: int
    participation_percent: int


async def seed_demo(session: AsyncSession, *, password: str) -> DemoSeedResult:
    """Create or refresh the local Studio team, accounts, completion, and invite.

    Safe to run again: accounts and the team stay, Grace's completion stays one
    record, and each run issues a new invite link.
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Demo password must be at least {MIN_PASSWORD_LENGTH} characters.")

    parse_timezone(DEMO_TEAM_TIMEZONE)
    accounts: dict[str, User] = {}
    for account in _ACCOUNTS:
        accounts[account.email] = await _upsert_user(session, account, password=password)
    admin = accounts[TEAM_ADMIN_EMAIL]
    member = accounts[TEAM_MEMBER_EMAIL]

    teams = TeamRepository(session)
    team = await _ensure_team(session, teams, admin_id=admin.id)
    await _ensure_membership(
        teams,
        team_id=team.id,
        user_id=admin.id,
        role=MembershipRole.TEAM_ADMINISTRATOR,
    )
    await _ensure_membership(
        teams,
        team_id=team.id,
        user_id=member.id,
        role=MembershipRole.MEMBER,
    )
    await session.commit()

    daily = DailyActivityService(
        teams=TeamRepository(session),
        activities=ActivityRepository(session),
        assignments=AssignmentRepository(session),
        completions=CompletionRepository(session),
        clock=get_clock(),
    )
    await daily.complete_daily_activity(user_id=member.id, team_id=team.id)

    invite_token = new_invitation_token()
    clock = get_clock()
    await InvitationRepository(session).create(
        team_id=team.id,
        created_by_user_id=admin.id,
        token_hash=hash_invitation_token(invite_token),
        expires_at=clock.now() + timedelta(days=DEFAULT_INVITATION_TTL_DAYS),
    )
    await session.commit()

    progress = ProgressService(
        teams=TeamRepository(session),
        activities=ActivityRepository(session),
        assignments=AssignmentRepository(session),
        completions=CompletionRepository(session),
        clock=get_clock(),
    )
    snapshot = await progress.get_today(user_id=admin.id, team_id=team.id)
    logger.info("demo_seed_completed team_id=%s", team.id)
    return DemoSeedResult(
        team_id=team.id,
        team_name=team.name,
        invite_token=invite_token,
        invite_path=f"/join?token={quote(invite_token, safe='')}",
        member_count=snapshot.member_count,
        completed_count=snapshot.completed_count,
        participation_percent=snapshot.participation_percent,
    )


async def _upsert_user(
    session: AsyncSession,
    account: _DemoAccount,
    *,
    password: str,
) -> User:
    email_column = User.__table__.c.email
    existing = await session.scalar(select(User).where(email_column == account.email))
    hashed_password = _password_helper.hash(password)
    if isinstance(existing, User):
        existing.hashed_password = hashed_password
        existing.display_name = account.display_name
        existing.is_superuser = account.is_superuser
        existing.is_active = True
        existing.is_verified = True
        await session.flush()
        return existing

    user = User(
        email=account.email,
        hashed_password=hashed_password,
        display_name=account.display_name,
        is_active=True,
        is_superuser=account.is_superuser,
        is_verified=True,
    )
    session.add(user)
    await session.flush()
    return user


async def _ensure_team(
    session: AsyncSession,
    teams: TeamRepository,
    *,
    admin_id: uuid.UUID,
) -> Team:
    rows = await teams.list_teams_for_user(user_id=admin_id)
    for team, _membership in rows:
        if team.name == DEMO_TEAM_NAME:
            return team
    created, _membership = await TeamService(TeamRepository(session)).create_team(
        user_id=admin_id,
        name=DEMO_TEAM_NAME,
        timezone=DEMO_TEAM_TIMEZONE,
    )
    return created


async def _ensure_membership(
    teams: TeamRepository,
    *,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    role: MembershipRole,
) -> None:
    membership = await teams.get_membership(team_id=team_id, user_id=user_id)
    if membership is None:
        await teams.add_membership(team_id=team_id, user_id=user_id, role=role)
        return
    membership.role = role
    membership.status = MembershipStatus.ACTIVE


def main() -> None:
    password = os.environ.get("DEMO_SEED_PASSWORD", "")
    if len(password) < MIN_PASSWORD_LENGTH:
        print(
            "Set DEMO_SEED_PASSWORD to at least "
            f"{MIN_PASSWORD_LENGTH} characters, then run this command again.",
            file=sys.stderr,
        )
        raise SystemExit(1)
    result = asyncio.run(_run(password))
    print("Demo accounts use DEMO_SEED_PASSWORD from the environment.")
    for note in DEMO_ACCOUNT_NOTES:
        print(f"  {note}")
    print(f"Team: {result.team_name}")
    print(
        "Participation today: "
        f"{result.completed_count} of {result.member_count} completed "
        f"({result.participation_percent}%)."
    )
    print(f"Invite path: {result.invite_path}")
    print("Open that path on the frontend, for example http://localhost:5173")


async def _run(password: str) -> DemoSeedResult:
    from app.core.db import async_session_maker

    async with async_session_maker() as session:
        return await seed_demo(session, password=password)


if __name__ == "__main__":
    main()
