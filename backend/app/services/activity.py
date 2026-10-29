from app.models import Activity
from app.models.activity import ActivityCategory
from app.repositories.activity import ActivityRepository


class ActivityLibraryService:
    def __init__(self, activities: ActivityRepository) -> None:
        self._activities = activities

    async def list_activities(self) -> list[Activity]:
        return await self._activities.list_all()

    async def create_activity(
        self,
        *,
        title: str,
        instructions: str,
        category: ActivityCategory,
        estimated_minutes: int,
    ) -> Activity:
        activity = await self._activities.create(
            title=title,
            instructions=instructions,
            category=category,
            estimated_minutes=estimated_minutes,
        )
        await self._activities.commit()
        return activity
