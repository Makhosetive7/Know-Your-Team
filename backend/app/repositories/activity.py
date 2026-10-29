import uuid
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Activity, ActivityCompletion, DailyActivity
from app.models.activity import ActivityCategory, CompletionOutcome


class ActivityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        title: str,
        instructions: str,
        category: ActivityCategory,
        estimated_minutes: int,
        is_active: bool = True,
    ) -> Activity:
        activity = Activity(
            title=title,
            instructions=instructions,
            category=category,
            estimated_minutes=estimated_minutes,
            is_active=is_active,
        )
        self._session.add(activity)
        await self._session.flush()
        return activity

    async def get(self, *, activity_id: uuid.UUID) -> Activity | None:
        activity = await self._session.get(Activity, activity_id)
        return activity if isinstance(activity, Activity) else None

    async def list_active(self) -> list[Activity]:
        statement = select(Activity).where(Activity.is_active.is_(True)).order_by(Activity.title)
        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def list_all(self) -> list[Activity]:
        statement = select(Activity).order_by(Activity.title)
        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def commit(self) -> None:
        await self._session.commit()


class AssignmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_team_and_date(
        self,
        *,
        team_id: uuid.UUID,
        activity_date: date,
    ) -> DailyActivity | None:
        statement = select(DailyActivity).where(
            DailyActivity.team_id == team_id,
            DailyActivity.activity_date == activity_date,
        )
        assignment = await self._session.scalar(statement)
        return assignment if isinstance(assignment, DailyActivity) else None

    async def create(
        self,
        *,
        team_id: uuid.UUID,
        activity_id: uuid.UUID,
        activity_date: date,
    ) -> DailyActivity:
        assignment = DailyActivity(
            team_id=team_id,
            activity_id=activity_id,
            activity_date=activity_date,
        )
        self._session.add(assignment)
        await self._session.flush()
        return assignment

    async def list_for_team(
        self,
        *,
        team_id: uuid.UUID,
        limit: int,
    ) -> list[tuple[DailyActivity, Activity]]:
        statement = (
            select(DailyActivity, Activity)
            .join(DailyActivity.activity)
            .where(DailyActivity.team_id == team_id)
            .order_by(DailyActivity.activity_date.desc())
            .limit(limit)
        )
        result = await self._session.execute(statement)
        return list(result.tuples().all())

    async def recent_activity_ids(
        self,
        *,
        team_id: uuid.UUID,
        on_date: date,
        window_days: int,
    ) -> set[uuid.UUID]:
        cutoff = on_date - timedelta(days=window_days)
        statement = select(DailyActivity.activity_id).where(
            DailyActivity.team_id == team_id,
            DailyActivity.activity_date < on_date,
            DailyActivity.activity_date >= cutoff,
        )
        result = await self._session.execute(statement)
        return set(result.scalars().all())

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()


class CompletionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(
        self,
        *,
        user_id: uuid.UUID,
        daily_activity_id: uuid.UUID,
    ) -> ActivityCompletion | None:
        statement = select(ActivityCompletion).where(
            ActivityCompletion.user_id == user_id,
            ActivityCompletion.daily_activity_id == daily_activity_id,
        )
        completion = await self._session.scalar(statement)
        return completion if isinstance(completion, ActivityCompletion) else None

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        daily_activity_id: uuid.UUID,
        outcome: CompletionOutcome,
    ) -> ActivityCompletion:
        completion = ActivityCompletion(
            user_id=user_id,
            daily_activity_id=daily_activity_id,
            outcome=outcome,
        )
        self._session.add(completion)
        await self._session.flush()
        return completion

    async def count_for_assignment(
        self,
        *,
        daily_activity_id: uuid.UUID,
        outcome: CompletionOutcome,
        user_ids: list[uuid.UUID],
    ) -> int:
        if not user_ids:
            return 0
        statement = (
            select(func.count())
            .select_from(ActivityCompletion)
            .where(
                ActivityCompletion.daily_activity_id == daily_activity_id,
                ActivityCompletion.outcome == outcome,
                ActivityCompletion.user_id.in_(user_ids),
            )
        )
        count = await self._session.scalar(statement)
        return int(count or 0)

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()
