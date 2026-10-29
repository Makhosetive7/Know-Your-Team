from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest import (
    FrozenClock,
    add_active_membership,
    auth_headers,
    create_team,
    error_code,
    parse_uuid,
    register_and_login,
)


async def test_team_members_share_the_same_daily_activity(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    al_id, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)

    ada = await client.get(
        f"/api/v1/teams/{team_id}/daily-activity",
        headers=auth_headers(ada_token),
    )
    al = await client.get(
        f"/api/v1/teams/{team_id}/daily-activity",
        headers=auth_headers(al_token),
    )
    assert ada.status_code == 200
    assert al.status_code == 200
    assert ada.json()["id"] == al.json()["id"]
    assert ada.json()["date"] == "2026-10-28"
    assert ada.json()["activity"]["title"]
    assert ada.json()["completion"] is None
    assert "hashed_password" not in ada.json()


async def test_different_timezones_can_have_different_dates(
    client: AsyncClient,
    frozen_clock: FrozenClock,
) -> None:
    frozen_clock.current = datetime(2026, 10, 28, 23, 30, tzinfo=UTC)
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    amsterdam = parse_uuid(
        await create_team(client, ada_token, name="Amsterdam", timezone="Europe/Amsterdam"),
    )
    new_york = parse_uuid(
        await create_team(client, al_token, name="New York", timezone="America/New_York"),
    )
    ada = await client.get(
        f"/api/v1/teams/{amsterdam}/daily-activity",
        headers=auth_headers(ada_token),
    )
    al = await client.get(
        f"/api/v1/teams/{new_york}/daily-activity",
        headers=auth_headers(al_token),
    )
    assert ada.json()["date"] == "2026-10-29"
    assert al.json()["date"] == "2026-10-28"


async def test_complete_is_idempotent(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team_id = parse_uuid(await create_team(client, token))
    first = await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/complete",
        headers=auth_headers(token),
    )
    second = await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/complete",
        headers=auth_headers(token),
    )
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["outcome"] == "completed"
    assert second.json()["outcome"] == "completed"
    daily = await client.get(
        f"/api/v1/teams/{team_id}/daily-activity",
        headers=auth_headers(token),
    )
    assert daily.json()["completion"]["outcome"] == "completed"


async def test_skip_then_complete_conflicts(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team_id = parse_uuid(await create_team(client, token))
    skipped = await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/skip",
        headers=auth_headers(token),
    )
    assert skipped.status_code == 200
    assert skipped.json()["outcome"] == "skipped"
    complete = await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/complete",
        headers=auth_headers(token),
    )
    assert complete.status_code == 409
    assert error_code(complete.json()) == "already_responded"


async def test_outsider_cannot_see_or_complete_daily_activity(client: AsyncClient) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    missing = await client.get(
        f"/api/v1/teams/{team_id}/daily-activity",
        headers=auth_headers(al_token),
    )
    complete = await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/complete",
        headers=auth_headers(al_token),
    )
    history = await client.get(
        f"/api/v1/teams/{team_id}/activities/history",
        headers=auth_headers(al_token),
    )
    assert missing.status_code == 404
    assert complete.status_code == 404
    assert history.status_code == 404
    assert error_code(missing.json()) == "team_not_found"


async def test_activity_history_includes_caller_completion(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team_id = parse_uuid(await create_team(client, token))
    await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/complete",
        headers=auth_headers(token),
    )
    history = await client.get(
        f"/api/v1/teams/{team_id}/activities/history",
        headers=auth_headers(token),
    )
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["completion"]["outcome"] == "completed"
    assert history.json()[0]["activity"]["title"]
