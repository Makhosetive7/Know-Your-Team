import uuid

from fastapi_users import schemas
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import MAX_DISPLAY_NAME_LENGTH


class UserRead(schemas.BaseUser[uuid.UUID]):
    display_name: str | None = None


class UserCreate(schemas.BaseUserCreate):
    display_name: str | None = Field(default=None, max_length=MAX_DISPLAY_NAME_LENGTH)


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    display_name: str | None = Field(default=None, max_length=MAX_DISPLAY_NAME_LENGTH)
