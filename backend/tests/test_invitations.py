from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.team import MembershipRole
from tests.conftest import (
    FrozenClock,
    add_active_membership,
    auth_headers,
    create_team,
    error_code,
    parse_uuid,
    register_and_login,
)


async def test_admin_creates_invitation_with_token_once(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    team = await create_team(client, token)
    team_id = parse_uuid(team)
    response = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(token),
        json={},
    )
    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["token"], str)
    assert body["token"]
    assert "token_hash" not in body

    listed = await client.get(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(token),
    )
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == body["id"]
    assert "token" not in listed.json()[0]


async def test_member_cannot_create_invitation(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    al_id, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    await add_active_membership(session_maker, team_id=team_id, user_id=al_id)
    response = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(al_token),
        json={},
    )
    assert response.status_code == 403
    assert error_code(response.json()) == "permission_denied"


async def test_outsider_invitation_routes_return_404(client: AsyncClient) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    created = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(ada_token),
        json={},
    )
    invitation_id = created.json()["id"]
    listed = await client.get(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(al_token),
    )
    revoked = await client.post(
        f"/api/v1/teams/{team_id}/invitations/{invitation_id}/revoke",
        headers=auth_headers(al_token),
    )
    assert listed.status_code == 404
    assert revoked.status_code == 404
    assert error_code(listed.json()) == "team_not_found"


async def test_user_can_preview_and_join_with_token(client: AsyncClient) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    created = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(ada_token),
        json={},
    )
    invite_token = created.json()["token"]

    preview = await client.get("/api/v1/teams/join", params={"token": invite_token})
    assert preview.status_code == 200
    assert preview.json() == {"team_name": "Apollo"}

    joined = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(al_token),
        json={"token": invite_token},
    )
    assert joined.status_code == 200
    assert joined.json()["id"] == str(team_id)
    assert joined.json()["role"] == MembershipRole.MEMBER

    second = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(al_token),
        json={"token": invite_token},
    )
    assert second.status_code == 409
    assert error_code(second.json()) == "already_a_member"


async def test_invalid_invitation_token_is_not_found(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    preview = await client.get("/api/v1/teams/join", params={"token": "not-a-real-token"})
    join = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(token),
        json={"token": "not-a-real-token"},
    )
    assert preview.status_code == 404
    assert join.status_code == 404
    assert error_code(preview.json()) == "invitation_invalid"
    assert preview.json() == join.json()


async def test_revoked_invitation_cannot_be_used(client: AsyncClient) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    created = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(ada_token),
        json={},
    )
    invite_token = created.json()["token"]
    invitation_id = created.json()["id"]
    revoked = await client.post(
        f"/api/v1/teams/{team_id}/invitations/{invitation_id}/revoke",
        headers=auth_headers(ada_token),
    )
    assert revoked.status_code == 204
    join = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(al_token),
        json={"token": invite_token},
    )
    assert join.status_code == 404
    assert error_code(join.json()) == "invitation_invalid"


async def test_expired_invitation_cannot_be_used(
    client: AsyncClient,
    frozen_clock: FrozenClock,
) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    _, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    created = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(ada_token),
        json={"expires_in_days": 1},
    )
    invite_token = created.json()["token"]
    frozen_clock.current = datetime(2026, 10, 30, 12, 0, tzinfo=UTC)
    join = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(al_token),
        json={"token": invite_token},
    )
    assert join.status_code == 404
    assert error_code(join.json()) == "invitation_invalid"


async def test_former_member_can_rejoin(client: AsyncClient) -> None:
    _, ada_token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    al_id, al_token = await register_and_login(client, email="al@example.com", display_name="Al")
    team_id = parse_uuid(await create_team(client, ada_token))
    created = await client.post(
        f"/api/v1/teams/{team_id}/invitations",
        headers=auth_headers(ada_token),
        json={},
    )
    invite_token = created.json()["token"]
    await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(al_token),
        json={"token": invite_token},
    )
    left = await client.delete(
        f"/api/v1/teams/{team_id}/members/{al_id}",
        headers=auth_headers(al_token),
    )
    assert left.status_code == 204
    rejoined = await client.post(
        "/api/v1/teams/join",
        headers=auth_headers(al_token),
        json={"token": invite_token},
    )
    assert rejoined.status_code == 200
    assert rejoined.json()["role"] == MembershipRole.MEMBER


async def test_join_requires_authentication(client: AsyncClient) -> None:
    response = await client.post("/api/v1/teams/join", json={"token": "abc"})
    assert response.status_code == 401
    assert error_code(response.json()) == "unauthenticated"
