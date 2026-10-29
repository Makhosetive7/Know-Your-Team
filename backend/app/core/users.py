import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users import schemas as fu_schemas
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.exceptions import InvalidPasswordException

from app.core.config import JWT_LIFETIME_SECONDS, MIN_PASSWORD_LENGTH, settings
from app.core.db import get_user_db
from app.models import User

logger = logging.getLogger(__name__)

AUTH_LOGIN_PATH = "api/v1/auth/login"


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.secret_key
    verification_token_secret = settings.secret_key

    async def validate_password(self, password: str, user: fu_schemas.UC | User) -> None:
        if len(password) < MIN_PASSWORD_LENGTH:
            raise InvalidPasswordException(
                reason=f"Password should be at least {MIN_PASSWORD_LENGTH} characters",
            )

    async def create(
        self,
        user_create: fu_schemas.UC,
        safe: bool = False,
        request: Request | None = None,
    ) -> User:
        user = await super().create(user_create, safe=safe, request=request)
        if user.is_verified:
            return user
        return await self.user_db.update(user, {"is_verified": True})

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        logger.info("user_registered user_id=%s", user.id)


async def get_user_manager(
    user_db: Annotated[SQLAlchemyUserDatabase[User, uuid.UUID], Depends(get_user_db)],
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


def get_jwt_strategy() -> JWTStrategy[User, uuid.UUID]:
    return JWTStrategy(secret=settings.secret_key, lifetime_seconds=JWT_LIFETIME_SECONDS)


bearer_transport = BearerTransport(tokenUrl=AUTH_LOGIN_PATH)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
