from httpx import AsyncClient

from tests.conftest import (
    TEST_DISPLAY_NAME,
    TEST_EMAIL,
    login_user,
    register_user,
)


def _error_code(response_json: object) -> str:
    assert isinstance(response_json, dict)
    error = response_json["error"]
    assert isinstance(error, dict)
    code = error["code"]
    assert isinstance(code, str)
    return code


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_get_me_without_token_returns_401(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert _error_code(response.json()) == "unauthenticated"


async def test_get_me_returns_current_user(client: AsyncClient) -> None:
    registered = await register_user(client)
    token = await login_user(client)
    response = await client.get("/api/v1/users/me", headers=_auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == registered["id"]
    assert body["email"] == TEST_EMAIL
    assert body["display_name"] == TEST_DISPLAY_NAME
    assert "hashed_password" not in body


async def test_patch_me_updates_display_name(client: AsyncClient) -> None:
    await register_user(client)
    token = await login_user(client)
    response = await client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"display_name": "Ada Lovelace"},
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Ada Lovelace"

    reread = await client.get("/api/v1/users/me", headers=_auth_headers(token))
    assert reread.json()["display_name"] == "Ada Lovelace"


async def test_patch_me_clears_display_name(client: AsyncClient) -> None:
    await register_user(client)
    token = await login_user(client)
    response = await client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"display_name": None},
    )
    assert response.status_code == 200
    assert response.json()["display_name"] is None


async def test_patch_me_cannot_set_superuser(client: AsyncClient) -> None:
    await register_user(client)
    token = await login_user(client)
    response = await client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"is_superuser": True, "display_name": "Still Ada"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["is_superuser"] is False
    assert body["display_name"] == "Still Ada"
