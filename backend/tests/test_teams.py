import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.team import MembershipRole
from tests.conftest import (
    add_active_membership,
    auth_headers,
    login_user,
    register_user,
)

TEAM_PAYLOAD = {"name": "Apollo", "timezone": "Europe/Amsterdam"}


def _error_code(response_json: object) -> str:
    assert isinstance(response_json, dict)
    error = response_json["error"]
    assert isinstance(error, dict)
    code = error["code"]
    assert isinstance(code, str)
    return code


def _team_id(body: object) -> uuid.UUID:
    assert isinstance(body, dict)
    raw_id = body["id"]
    assert isinstance(raw_id, str)
    return uuid.UUID(raw_id)


async def _register_and_login(
    client: AsyncClient,
    *,
    email: str,
    display_name: str,
) -> tuple[uuid.UUID, str]:
    registered = await register_user(client, email=email, display_name=display_name)
    raw_id = registered["id"]
    assert isinstance(raw_id, str)
    token = await login_user(client, email=email)
    return uuid.UUID(raw_id), token


async def test_create_team_unauthenticated_returns_401(client: AsyncClient) -> None:
    response = await client.post("/api/v1/teams", json=TEAM_PAYLOAD)
    assert response.status_code == 401
    assert _error_code(response.json()) == "unauthenticated"


async def test_create_team_makes_caller_administrator(client: AsyncClient) -> None:
    _, token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    response = await client.post(
        "/api/v1/teams",
        headers=auth_headers(token),
        json=TEAM_PAYLOAD,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Apollo"
    assert body["timezone"] == "Europe/Amsterdam"
    assert body["role"] == MembershipRole.TEAM_ADMINISTRATOR
    assert "id" in body
    assert "created_at" in body


async def test_create_team_rejects_blank_name(client: AsyncClient) -> None:
    _, token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    response = await client.post(
        "/api/v1/teams",
        headers=auth_headers(token),
        json={"name": "   ", "timezone": "UTC"},
    )
    assert response.status_code == 422
    assert _error_code(response.json()) == "validation_error"


async def test_create_team_rejects_unknown_timezone(client: AsyncClient) -> None:
    _, token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    response = await client.post(
        "/api/v1/teams",
        headers=auth_headers(token),
        json={"name": "Apollo", "timezone": "Not/A/Zone"},
    )
    assert response.status_code == 422
    assert _error_code(response.json()) == "validation_error"


async def test_list_teams_returns_only_callers_teams(client: AsyncClient) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    _, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    await client.post("/api/v1/teams", headers=auth_headers(ada_token), json=TEAM_PAYLOAD)
    await client.post(
        "/api/v1/teams",
        headers=auth_headers(al_token),
        json={"name": "Beacon", "timezone": "UTC"},
    )

    ada_list = await client.get("/api/v1/teams", headers=auth_headers(ada_token))
    assert ada_list.status_code == 200
    ada_names = [row["name"] for row in ada_list.json()]
    assert ada_names == ["Apollo"]

    empty_before = await client.get("/api/v1/teams", headers=auth_headers(al_token))
    al_names = [row["name"] for row in empty_before.json()]
    assert al_names == ["Beacon"]


async def test_list_teams_empty_for_user_without_teams(client: AsyncClient) -> None:
    _, token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    response = await client.get("/api/v1/teams", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json() == []


async def test_get_team_returns_404_for_outsider(client: AsyncClient) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    _, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())

    missing = await client.get(
        f"/api/v1/teams/{uuid.uuid4()}",
        headers=auth_headers(ada_token),
    )
    assert missing.status_code == 404
    assert _error_code(missing.json()) == "team_not_found"

    outsider = await client.get(
        f"/api/v1/teams/{team_id}",
        headers=auth_headers(al_token),
    )
    assert outsider.status_code == 404
    assert _error_code(outsider.json()) == "team_not_found"
    assert outsider.json() == missing.json()


async def test_get_team_returns_current_membership(client: AsyncClient) -> None:
    _, token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    response = await client.get(f"/api/v1/teams/{team_id}", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["id"] == str(team_id)
    assert response.json()["role"] == MembershipRole.TEAM_ADMINISTRATOR


async def test_list_members_includes_active_only(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)

    response = await client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_headers(ada_token),
    )
    assert response.status_code == 200
    members = response.json()
    emails = sorted(member["email"] for member in members)
    assert emails == ["ada@example.com", "al@example.com"]
    by_email = {member["email"]: member for member in members}
    assert by_email["ada@example.com"]["role"] == MembershipRole.TEAM_ADMINISTRATOR
    assert by_email["al@example.com"]["role"] == MembershipRole.MEMBER
    assert by_email["ada@example.com"]["display_name"] == "Ada"
    assert by_email["al@example.com"]["user_id"] == str(al_id)

    as_member = await client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_headers(al_token),
    )
    assert as_member.status_code == 200


async def test_list_members_hidden_from_non_member(
    client: AsyncClient,
) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    _, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    response = await client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_headers(al_token),
    )
    assert response.status_code == 404
    assert _error_code(response.json()) == "team_not_found"


async def test_member_can_leave(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)

    response = await client.delete(
        f"/api/v1/teams/{team_id}/members/{al_id}",
        headers=auth_headers(al_token),
    )
    assert response.status_code == 204

    listed = await client.get("/api/v1/teams", headers=auth_headers(al_token))
    assert listed.json() == []

    members = await client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_headers(ada_token),
    )
    emails = [member["email"] for member in members.json()]
    assert emails == ["ada@example.com"]


async def test_member_cannot_remove_another_member(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    ada_id, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    await add_active_membership(
        session_maker,
        team_id=team_id,
        user_id=al_id,
        role=MembershipRole.MEMBER,
    )

    response = await client.delete(
        f"/api/v1/teams/{team_id}/members/{ada_id}",
        headers=auth_headers(al_token),
    )
    assert response.status_code == 403
    assert _error_code(response.json()) == "permission_denied"


async def test_admin_can_remove_member(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)

    response = await client.delete(
        f"/api/v1/teams/{team_id}/members/{al_id}",
        headers=auth_headers(ada_token),
    )
    assert response.status_code == 204

    members = await client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_headers(ada_token),
    )
    assert [member["email"] for member in members.json()] == ["ada@example.com"]

    hidden = await client.get(f"/api/v1/teams/{team_id}", headers=auth_headers(al_token))
    assert hidden.status_code == 404
    assert _error_code(hidden.json()) == "team_not_found"


async def test_outsider_remove_returns_same_404_as_missing_team(client: AsyncClient) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    missing_team = uuid.uuid4()
    missing = await client.delete(
        f"/api/v1/teams/{missing_team}/members/{al_id}",
        headers=auth_headers(al_token),
    )
    outsider = await client.delete(
        f"/api/v1/teams/{team_id}/members/{al_id}",
        headers=auth_headers(al_token),
    )
    assert missing.status_code == 404
    assert outsider.status_code == 404
    assert _error_code(missing.json()) == "team_not_found"
    assert outsider.json() == missing.json()


async def test_last_administrator_cannot_leave(client: AsyncClient) -> None:
    ada_id, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    response = await client.delete(
        f"/api/v1/teams/{team_id}/members/{ada_id}",
        headers=auth_headers(ada_token),
    )
    assert response.status_code == 409
    assert _error_code(response.json()) == "last_administrator"

    still_there = await client.get(f"/api/v1/teams/{team_id}", headers=auth_headers(ada_token))
    assert still_there.status_code == 200


async def test_admin_cannot_remove_last_administrator(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    ada_id, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    await add_active_membership(
        session_maker,
        team_id=team_id,
        user_id=al_id,
        role=MembershipRole.TEAM_ADMINISTRATOR,
    )

    response = await client.delete(
        f"/api/v1/teams/{team_id}/members/{ada_id}",
        headers=auth_headers(al_token),
    )
    assert response.status_code == 204

    blocked = await client.delete(
        f"/api/v1/teams/{team_id}/members/{al_id}",
        headers=auth_headers(al_token),
    )
    assert blocked.status_code == 409
    assert _error_code(blocked.json()) == "last_administrator"


async def test_admin_remove_unknown_member_returns_404(
    client: AsyncClient,
) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    response = await client.delete(
        f"/api/v1/teams/{team_id}/members/{uuid.uuid4()}",
        headers=auth_headers(ada_token),
    )
    assert response.status_code == 404
    assert _error_code(response.json()) == "member_not_found"


async def test_admin_can_patch_team_name_and_timezone(client: AsyncClient) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    response = await client.patch(
        f"/api/v1/teams/{team_id}",
        headers=auth_headers(ada_token),
        json={"name": "Beacon", "timezone": "UTC"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Beacon"
    assert response.json()["timezone"] == "UTC"


async def test_member_cannot_patch_team(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await _register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    al_id, al_token = await _register_and_login(
        client,
        email="al@example.com",
        display_name="Al",
    )
    created = await client.post(
        "/api/v1/teams",
        headers=auth_headers(ada_token),
        json=TEAM_PAYLOAD,
    )
    team_id = _team_id(created.json())
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)
    response = await client.patch(
        f"/api/v1/teams/{team_id}",
        headers=auth_headers(al_token),
        json={"name": "Hijacked"},
    )
    assert response.status_code == 403
    assert _error_code(response.json()) == "permission_denied"
