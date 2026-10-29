import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.core.config import (
    DEFAULT_ACTIVITY_MINUTES,
    MAX_ACTIVITY_INSTRUCTIONS_LENGTH,
    MAX_ACTIVITY_MINUTES,
    MAX_ACTIVITY_TITLE_LENGTH,
)
from app.models.activity import ActivityCategory, CompletionOutcome


class ActivityRead(BaseModel):
    id: uuid.UUID
    title: str
    instructions: str
    category: ActivityCategory
    estimated_minutes: int


class ActivityAdminRead(ActivityRead):
    is_active: bool


class ActivityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=MAX_ACTIVITY_TITLE_LENGTH)
    instructions: str = Field(min_length=1, max_length=MAX_ACTIVITY_INSTRUCTIONS_LENGTH)
    category: ActivityCategory
    estimated_minutes: int = Field(
        default=DEFAULT_ACTIVITY_MINUTES,
        ge=1,
        le=MAX_ACTIVITY_MINUTES,
    )


class CompletionRead(BaseModel):
    outcome: CompletionOutcome
    created_at: datetime


class DailyActivityRead(BaseModel):
    id: uuid.UUID
    date: date
    activity: ActivityRead
    completion: CompletionRead | None
