import os
import uuid
from collections.abc import AsyncGenerator, Iterator
from datetime import UTC, datetime

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.core.activity_seed import SEED_ACTIVITIES
from app.core.clock import SystemClock, set_clock
from app.core.db import get_async_session
from app.core.rate_limit import rate_limiter
from app.main import create_app
from app.models import Activity, Base, TeamMembership, User
from app.models.activity import ActivityCategory
from app.models.team import MembershipRole, MembershipStatus

TEST_EMAIL = "ada@example.com"
TEST_PASSWORD = "password1"
TEST_DISPLAY_NAME = "Ada"
FROZEN_NOW = datetime(2026, 10, 28, 12, 0, tzinfo=UTC)


class FrozenClock:
    def __init__(self, current: datetime) -> None:
        self.current = current

    def now(self) -> datetime:
        return self.current


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> Iterator[None]:
    rate_limiter.reset()
    yield
    rate_limiter.reset()


@pytest.fixture
def frozen_clock() -> Iterator[FrozenClock]:
    clock = FrozenClock(FROZEN_NOW)
    set_clock(clock)
    yield clock
    set_clock(SystemClock())


@pytest.fixture
async def engine() -> AsyncGenerator[AsyncEngine, None]:
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        for row in SEED_ACTIVITIES:
            session.add(
                Activity(
                    id=row["id"],
                    title=row["title"],
                    instructions=row["instructions"],
                    category=ActivityCategory(row["category"]),
                    estimated_minutes=row["estimated_minutes"],
                    is_active=row["is_active"],
                )
            )
        await session.commit()
    yield test_engine
    await test_engine.dispose()


@pytest.fixture
def session_maker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def client(
    session_maker: async_sessionmaker[AsyncSession],
    frozen_clock: FrozenClock,
) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_async_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            yield session

    application = create_app()
    application.dependency_overrides[get_async_session] = override_get_async_session
    _ = frozen_clock

    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client


async def register_user(
    client: AsyncClient,
    *,
    email: str = TEST_EMAIL,
    password: str = TEST_PASSWORD,
    display_name: str | None = TEST_DISPLAY_NAME,
) -> dict[str, object]:
    payload: dict[str, object] = {"email": email, "password": password}
    if display_name is not None:
        payload["display_name"] = display_name
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert isinstance(body, dict)
    return body


async def login_user(
    client: AsyncClient,
    *,
    email: str = TEST_EMAIL,
    password: str = TEST_PASSWORD,
) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    body = response.json()
    token = body["access_token"]
    assert isinstance(token, str)
    return token


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def error_code(response_json: object) -> str:
    assert isinstance(response_json, dict)
    error = response_json["error"]
    assert isinstance(error, dict)
    code = error["code"]
    assert isinstance(code, str)
    return code


async def register_and_login(
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


async def create_team(
    client: AsyncClient,
    token: str,
    *,
    name: str = "Apollo",
    timezone: str = "Europe/Amsterdam",
) -> dict[str, object]:
    response = await client.post(
        "/api/v1/teams",
        headers=auth_headers(token),
        json={"name": name, "timezone": timezone},
    )
    assert response.status_code == 201
    body = response.json()
    assert isinstance(body, dict)
    return body


def parse_uuid(body: object, key: str = "id") -> uuid.UUID:
    assert isinstance(body, dict)
    raw_id = body[key]
    assert isinstance(raw_id, str)
    return uuid.UUID(raw_id)


async def add_active_membership(
    session_maker: async_sessionmaker[AsyncSession],
    *,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    role: MembershipRole = MembershipRole.MEMBER,
) -> None:
    async with session_maker() as session:
        session.add(
            TeamMembership(
                team_id=team_id,
                user_id=user_id,
                role=role,
                status=MembershipStatus.ACTIVE,
            )
        )
        await session.commit()


async def set_superuser(
    session_maker: async_sessionmaker[AsyncSession],
    *,
    user_id: uuid.UUID,
) -> None:
    async with session_maker() as session:
        user = await session.get(User, user_id)
        assert user is not None
        user.is_superuser = True
        await session.commit()
