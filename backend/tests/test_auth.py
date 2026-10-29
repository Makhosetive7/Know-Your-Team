from httpx import AsyncClient

from tests.conftest import TEST_DISPLAY_NAME, TEST_EMAIL, TEST_PASSWORD, register_user


def _error_code(response_json: object) -> str:
    assert isinstance(response_json, dict)
    error = response_json["error"]
    assert isinstance(error, dict)
    code = error["code"]
    assert isinstance(code, str)
    return code


async def test_register_returns_user_without_password(client: AsyncClient) -> None:
    body = await register_user(client)
    assert body["email"] == TEST_EMAIL
    assert body["display_name"] == TEST_DISPLAY_NAME
    assert body["is_verified"] is True
    assert body["is_superuser"] is False
    assert "password" not in body
    assert "hashed_password" not in body
    assert "id" in body


async def test_register_duplicate_email_returns_conflict(client: AsyncClient) -> None:
    await register_user(client)
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 409
    assert _error_code(response.json()) == "user_already_exists"


async def test_register_weak_password_returns_error(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": TEST_EMAIL, "password": "short"},
    )
    assert response.status_code == 400
    assert _error_code(response.json()) == "invalid_password"


async def test_login_returns_access_token(client: AsyncClient) -> None:
    await register_user(client)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str)
    assert body["access_token"]


async def test_login_bad_password_returns_unauthenticated(client: AsyncClient) -> None:
    await register_user(client)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": TEST_EMAIL, "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert _error_code(response.json()) == "login_bad_credentials"


async def test_login_unknown_email_returns_unauthenticated(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "missing@example.com", "password": TEST_PASSWORD},
    )
    assert response.status_code == 401
    assert _error_code(response.json()) == "login_bad_credentials"


async def test_logout_returns_no_content(client: AsyncClient) -> None:
    await register_user(client)
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    token = login_response.json()["access_token"]
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204


async def test_register_invalid_body_returns_validation_error(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/register", json={"email": "not-an-email"})
    assert response.status_code == 422
    assert _error_code(response.json()) == "validation_error"
