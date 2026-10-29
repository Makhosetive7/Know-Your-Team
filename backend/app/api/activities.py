import uuid

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DailyActivityServiceDep
from app.core.config import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT
from app.models import Activity, ActivityCompletion, DailyActivity
from app.schemas.activity import ActivityRead, CompletionRead, DailyActivityRead

router = APIRouter()


def _activity_read(activity: Activity) -> ActivityRead:
    return ActivityRead(
        id=activity.id,
        title=activity.title,
        instructions=activity.instructions,
        category=activity.category,
        estimated_minutes=activity.estimated_minutes,
    )


def _completion_read(completion: ActivityCompletion | None) -> CompletionRead | None:
    if completion is None:
        return None
    return CompletionRead(outcome=completion.outcome, created_at=completion.created_at)


def _daily_read(
    assignment: DailyActivity,
    activity: Activity,
    completion: ActivityCompletion | None,
) -> DailyActivityRead:
    return DailyActivityRead(
        id=assignment.id,
        date=assignment.activity_date,
        activity=_activity_read(activity),
        completion=_completion_read(completion),
    )


@router.get("/{team_id}/daily-activity", response_model=DailyActivityRead)
async def get_daily_activity(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    daily_activities: DailyActivityServiceDep,
) -> DailyActivityRead:
    assignment, activity, completion = await daily_activities.get_daily_activity(
        user_id=current_user.id,
        team_id=team_id,
    )
    return _daily_read(assignment, activity, completion)


@router.get("/{team_id}/activities/history", response_model=list[DailyActivityRead])
async def list_activity_history(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    daily_activities: DailyActivityServiceDep,
    limit: int = Query(default=DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
) -> list[DailyActivityRead]:
    rows = await daily_activities.list_history(
        user_id=current_user.id,
        team_id=team_id,
        limit=limit,
    )
    return [
        _daily_read(assignment, activity, completion) for assignment, activity, completion in rows
    ]


@router.post(
    "/{team_id}/daily-activity/complete",
    response_model=CompletionRead,
    status_code=status.HTTP_200_OK,
)
async def complete_daily_activity(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    daily_activities: DailyActivityServiceDep,
) -> CompletionRead:
    completion = await daily_activities.complete_daily_activity(
        user_id=current_user.id,
        team_id=team_id,
    )
    return CompletionRead(outcome=completion.outcome, created_at=completion.created_at)


@router.post(
    "/{team_id}/daily-activity/skip",
    response_model=CompletionRead,
    status_code=status.HTTP_200_OK,
)
async def skip_daily_activity(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    daily_activities: DailyActivityServiceDep,
) -> CompletionRead:
    completion = await daily_activities.skip_daily_activity(
        user_id=current_user.id,
        team_id=team_id,
    )
    return CompletionRead(outcome=completion.outcome, created_at=completion.created_at)
