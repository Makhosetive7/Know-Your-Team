import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import MAX_TEAM_NAME_LENGTH, MAX_TIMEZONE_LENGTH
from app.core.timezones import parse_timezone
from app.models.team import MembershipRole


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=MAX_TEAM_NAME_LENGTH)
    timezone: str = Field(min_length=1, max_length=MAX_TIMEZONE_LENGTH)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Team name cannot be blank.")
        return stripped

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        return parse_timezone(value).key


class TeamUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = Field(default=None, min_length=1, max_length=MAX_TEAM_NAME_LENGTH)
    timezone: str | None = Field(default=None, min_length=1, max_length=MAX_TIMEZONE_LENGTH)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Team name cannot be blank.")
        return stripped

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return parse_timezone(value).key


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    timezone: str
    role: MembershipRole
    created_at: datetime


class TeamMemberRead(BaseModel):
    user_id: uuid.UUID
    email: str
    display_name: str | None
    role: MembershipRole
