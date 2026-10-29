from datetime import date

from pydantic import BaseModel

from app.schemas.activity import ActivityRead


class TeamProgressRead(BaseModel):
    date: date
    member_count: int
    completed_count: int
    skipped_count: int
    participation_percent: int
    activity: ActivityRead | None


class TeamProgressHistoryItem(BaseModel):
    date: date
    member_count: int
    completed_count: int
    skipped_count: int
    participation_percent: int
    activity: ActivityRead
