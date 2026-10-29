import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models import User

engine = create_async_engine(settings.database_url)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AsyncGenerator[SQLAlchemyUserDatabase[User, uuid.UUID], None]:
    yield SQLAlchemyUserDatabase(session, User)
