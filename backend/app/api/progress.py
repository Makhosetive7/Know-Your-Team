import uuid

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, ProgressServiceDep
from app.core.config import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT
from app.models import Activity
from app.schemas.activity import ActivityRead
from app.schemas.progress import TeamProgressHistoryItem, TeamProgressRead
from app.services.progress import TeamProgressSnapshot

router = APIRouter()


def _activity_read(activity: Activity) -> ActivityRead:
    return ActivityRead(
        id=activity.id,
        title=activity.title,
        instructions=activity.instructions,
        category=activity.category,
        estimated_minutes=activity.estimated_minutes,
    )


def _progress_read(snapshot: TeamProgressSnapshot) -> TeamProgressRead:
    activity = None if snapshot.activity is None else _activity_read(snapshot.activity)
    return TeamProgressRead(
        date=snapshot.activity_date,
        member_count=snapshot.member_count,
        completed_count=snapshot.completed_count,
        skipped_count=snapshot.skipped_count,
        participation_percent=snapshot.participation_percent,
        activity=activity,
    )


@router.get("/{team_id}/progress", response_model=TeamProgressRead)
async def get_team_progress(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    progress: ProgressServiceDep,
) -> TeamProgressRead:
    snapshot = await progress.get_today(user_id=current_user.id, team_id=team_id)
    return _progress_read(snapshot)


@router.get("/{team_id}/progress/history", response_model=list[TeamProgressHistoryItem])
async def list_progress_history(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    progress: ProgressServiceDep,
    limit: int = Query(default=DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
) -> list[TeamProgressHistoryItem]:
    snapshots = await progress.list_history(
        user_id=current_user.id,
        team_id=team_id,
        limit=limit,
    )
    items: list[TeamProgressHistoryItem] = []
    for snapshot in snapshots:
        if snapshot.activity is None:
            continue
        items.append(
            TeamProgressHistoryItem(
                date=snapshot.activity_date,
                member_count=snapshot.member_count,
                completed_count=snapshot.completed_count,
                skipped_count=snapshot.skipped_count,
                participation_percent=snapshot.participation_percent,
                activity=_activity_read(snapshot.activity),
            )
        )
    return items
