from fastapi import APIRouter, status

from app.api.deps import ActivityLibraryServiceDep, CurrentSuperuser
from app.models import Activity
from app.schemas.activity import ActivityAdminRead, ActivityCreate

router = APIRouter()


def _admin_read(activity: Activity) -> ActivityAdminRead:
    return ActivityAdminRead(
        id=activity.id,
        title=activity.title,
        instructions=activity.instructions,
        category=activity.category,
        estimated_minutes=activity.estimated_minutes,
        is_active=activity.is_active,
    )


@router.get("/activities", response_model=list[ActivityAdminRead])
async def list_activities(
    current_user: CurrentSuperuser,
    library: ActivityLibraryServiceDep,
) -> list[ActivityAdminRead]:
    del current_user
    activities = await library.list_activities()
    return [_admin_read(activity) for activity in activities]


@router.post(
    "/activities",
    response_model=ActivityAdminRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity(
    body: ActivityCreate,
    current_user: CurrentSuperuser,
    library: ActivityLibraryServiceDep,
) -> ActivityAdminRead:
    del current_user
    activity = await library.create_activity(
        title=body.title,
        instructions=body.instructions,
        category=body.category,
        estimated_minutes=body.estimated_minutes,
    )
    return _admin_read(activity)
