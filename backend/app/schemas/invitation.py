import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.config import DEFAULT_INVITATION_TTL_DAYS, MAX_INVITATION_TTL_DAYS


class InvitationCreate(BaseModel):
    expires_in_days: int = Field(
        default=DEFAULT_INVITATION_TTL_DAYS,
        ge=1,
        le=MAX_INVITATION_TTL_DAYS,
    )


class InvitationCreated(BaseModel):
    id: uuid.UUID
    token: str
    expires_at: datetime
    revoked_at: datetime | None


class InvitationRead(BaseModel):
    id: uuid.UUID
    expires_at: datetime
    revoked_at: datetime | None
    created_at: datetime


class InvitationPreview(BaseModel):
    team_name: str


class JoinTeamRequest(BaseModel):
    token: str = Field(min_length=1)
