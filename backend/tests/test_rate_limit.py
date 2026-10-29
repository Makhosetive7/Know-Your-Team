import pytest
from httpx import AsyncClient

from app.core.config import settings
from tests.conftest import auth_headers, create_team, error_code, parse_uuid, register_and_login


async def test_login_is_rate_limited(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "auth_rate_limit_max", 2)
    await register_and_login(client, email="ada@example.com", display_name="Ada")
    first = await client.post(
        "/api/v1/auth/login",
        data={"username": "ada@example.com", "password": "password1"},
    )
    blocked = await client.post(
        "/api/v1/auth/login",
        data={"username": "ada@example.com", "password": "password1"},
    )
    assert first.status_code == 200
    assert blocked.status_code == 429
    assert error_code(blocked.json()) == "rate_limited"
    assert blocked.headers["retry-after"] == str(settings.auth_rate_limit_window_seconds)


async def test_invitation_create_is_rate_limited(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "invitation_create_rate_limit_max", 1)
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team_id = parse_uuid(await create_team(client, token))
    first = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(token),
        json={},
    )
    blocked = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(token),
        json={},
    )
    assert first.status_code == 201
    assert blocked.status_code == 429
    assert error_code(blocked.json()) == "rate_limited"
