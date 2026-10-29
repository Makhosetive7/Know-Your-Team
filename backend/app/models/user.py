from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import MAX_DISPLAY_NAME_LENGTH
from app.models.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    display_name: Mapped[str | None] = mapped_column(
        String(MAX_DISPLAY_NAME_LENGTH),
        nullable=True,
    )
