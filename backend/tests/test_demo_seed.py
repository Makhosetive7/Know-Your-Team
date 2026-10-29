import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.demo_seed import (
    INVITEE_EMAIL,
    PLATFORM_ADMIN_EMAIL,
    TEAM_ADMIN_EMAIL,
    TEAM_MEMBER_EMAIL,
    seed_demo,
)
from app.models import ActivityCompletion, TeamMembership, User
from app.models.team import MembershipStatus
from tests.conftest import TEST_PASSWORD, auth_headers, error_code, login_user

_PASSWORD = TEST_PASSWORD


async def test_seed_demo_rejects_a_short_password(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        with pytest.raises(ValueError, match="at least"):
            await seed_demo(session, password="short")


async def test_seed_demo_accounts_invite_and_participation(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        first = await seed_demo(session, password=_PASSWORD)
    async with session_maker() as session:
        second = await seed_demo(session, password=_PASSWORD)

    assert first.team_id == second.team_id
    assert first.team_name == "Studio"
    assert first.invite_token != second.invite_token
    assert first.member_count == 2
    assert first.completed_count == 1
    assert first.participation_percent == 50
    assert second.completed_count == 1

    async with session_maker() as session:
        users = await session.scalars(select(User))
        memberships = await session.scalar(
            select(func.count())
            .select_from(TeamMembership)
            .where(TeamMembership.status == MembershipStatus.ACTIVE)
        )
        completions = await session.scalar(select(func.count()).select_from(ActivityCompletion))
    assert sorted(user.email for user in users.all()) == sorted(
        [PLATFORM_ADMIN_EMAIL, TEAM_ADMIN_EMAIL, TEAM_MEMBER_EMAIL, INVITEE_EMAIL]
    )
    assert memberships == 2
    assert completions == 1

    for token in (first.invite_token, second.invite_token):
        preview = await client.get("/api/v1/teams/join", params={"token": token})
        assert preview.status_code == 200
        assert preview.json()["team_name"] == "Studio"

    ada = await login_user(client, email=TEAM_ADMIN_EMAIL, password=_PASSWORD)
    ada_headers = auth_headers(ada)
    progress = await client.get(
        f"/api/v1/teams/{first.team_id}/progress",
        headers=ada_headers,
    )
    assert progress.status_code == 200
    assert progress.json()["participation_percent"] == 50

    ada_today = await client.get(
        f"/api/v1/teams/{first.team_id}/daily-activity",
        headers=ada_headers,
    )
    assert ada_today.status_code == 200
    assert ada_today.json()["completion"] is None

    grace = await login_user(client, email=TEAM_MEMBER_EMAIL, password=_PASSWORD)
    grace_today = await client.get(
        f"/api/v1/teams/{first.team_id}/daily-activity",
        headers=auth_headers(grace),
    )
    assert grace_today.json()["completion"]["outcome"] == "completed"

    forbidden = await client.get("/api/v1/admin/activities", headers=ada_headers)
    assert forbidden.status_code == 403
    assert error_code(forbidden.json()) == "permission_denied"

    platform = await login_user(client, email=PLATFORM_ADMIN_EMAIL, password=_PASSWORD)
    library = await client.get("/api/v1/admin/activities", headers=auth_headers(platform))
    assert library.status_code == 200
    assert len(library.json()) >= 1

    nia = await login_user(client, email=INVITEE_EMAIL, password=_PASSWORD)
    joined = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(nia),
        json={"token": first.invite_token},
    )
    assert joined.status_code == 200
    assert joined.json()["name"] == "Studio"
    assert uuid.UUID(joined.json()["id"]) == first.team_id
