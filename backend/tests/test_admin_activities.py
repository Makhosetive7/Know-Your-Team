from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest import (
    auth_headers,
    error_code,
    register_and_login,
    set_superuser,
)


async def test_non_admin_cannot_manage_activity_library(client: AsyncClient) -> None:
    _, token = await register_and_login(client, email="ada@example.com", display_name="Ada")
    listed = await client.get("/api/v1/admin/activities", headers=auth_headers(token))
    created = await client.post(
        "/api/v1/admin/activities",
        headers=auth_headers(token),
        json={
            "title": "New prompt",
            "instructions": "Say hello.",
            "category": "fun",
            "estimated_minutes": 3,
        },
    )
    assert listed.status_code == 403
    assert created.status_code == 403
    assert error_code(listed.json()) == "permission_denied"


async def test_superuser_can_list_and_create_activities(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    user_id, token = await register_and_login(
        client,
        email="ada@example.com",
        display_name="Ada",
    )
    await set_superuser(session_maker, user_id=user_id)
    listed = await client.get("/api/v1/admin/activities", headers=auth_headers(token))
    assert listed.status_code == 200
    assert len(listed.json()) >= 8
    created = await client.post(
        "/api/v1/admin/activities",
        headers=auth_headers(token),
        json={
            "title": "Coffee order",
            "instructions": "Share how you take your coffee or tea.",
            "category": "icebreaker",
            "estimated_minutes": 3,
        },
    )
    assert created.status_code == 201
    assert created.json()["title"] == "Coffee order"
    assert created.json()["is_active"] is True
