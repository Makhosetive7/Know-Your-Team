from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest import (
    add_active_membership,
    auth_headers,
    create_team,
    error_code,
    parse_uuid,
    register_and_login,
)


async def test_progress_before_assignment_has_no_activity(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team_id = parse_uuid(await create_team(client, token))
    response = await client.get(
        f"/api/v1/teams/{team_id}/progress",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2026-10-28"
    assert body["member_count"] == 1
    assert body["completed_count"] == 0
    assert body["skipped_count"] == 0
    assert body["participation_percent"] == 0
    assert body["activity"] is None
    assert "user_id" not in body


async def test_progress_counts_completions_not_skips(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    al_id, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)
    await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/complete",
        headers=auth_headers(ada_token),
    )
    await client.post(
        f"/api/v1/teams/{team_id}/daily-activity/skip",
        headers=auth_headers(al_token),
    )
    response = await client.get(
        f"/api/v1/teams/{team_id}/progress",
        headers=auth_headers(ada_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["member_count"] == 2
    assert body["completed_count"] == 1
    assert body["skipped_count"] == 1
    assert body["participation_percent"] == 50
    assert body["activity"]["title"]
    assert "email" not in body


async def test_progress_history_lists_assigned_days(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team_id = parse_uuid(await create_team(client, token))
    await client.get(
        f"/api/v1/teams/{team_id}/daily-activity",
        headers=auth_headers(token),
    )
    history = await client.get(
        f"/api/v1/teams/{team_id}/progress/history",
        headers=auth_headers(token),
    )
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["date"] == "2026-10-28"
    assert history.json()[0]["member_count"] == 1
    assert history.json()[0]["completed_count"] == 0


async def test_progress_hidden_from_outsider(client: AsyncClient) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    response = await client.get(
        f"/api/v1/teams/{team_id}/progress",
        headers=auth_headers(al_token),
    )
    assert response.status_code == 404
    assert error_code(response.json()) == "team_not_found"
