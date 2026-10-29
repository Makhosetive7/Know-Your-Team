import logging
import uuid
from datetime import date

from sqlalchemy.exc import IntegrityError

from app.core.clock import Clock
from app.core.config import RECENT_ACTIVITY_WINDOW_DAYS
from app.core.exceptions import ConflictError, NotFoundError
from app.core.timezones import local_date
from app.models import Activity, ActivityCompletion, DailyActivity, Team, TeamMembership
from app.models.activity import CompletionOutcome
from app.repositories.activity import (
    ActivityRepository,
    AssignmentRepository,
    CompletionRepository,
)
from app.repositories.team import TeamRepository

logger = logging.getLogger(__name__)


class DailyActivityService:
    def __init__(
        self,
        teams: TeamRepository,
        activities: ActivityRepository,
        assignments: AssignmentRepository,
        completions: CompletionRepository,
        clock: Clock,
    ) -> None:
        self._teams = teams
        self._activities = activities
        self._assignments = assignments
        self._completions = completions
        self._clock = clock

    async def get_daily_activity(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> tuple[DailyActivity, Activity, ActivityCompletion | None]:
        await self._require_active_member(user_id=user_id, team_id=team_id)
        assignment = await self._get_or_create_today(team_id=team_id)
        activity = await self._require_activity(activity_id=assignment.activity_id)
        completion = await self._completions.get(
            user_id=user_id,
            daily_activity_id=assignment.id,
        )
        return assignment, activity, completion

    async def list_history(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
        limit: int,
    ) -> list[tuple[DailyActivity, Activity, ActivityCompletion | None]]:
        await self._require_active_member(user_id=user_id, team_id=team_id)
        rows = await self._assignments.list_for_team(team_id=team_id, limit=limit)
        history: list[tuple[DailyActivity, Activity, ActivityCompletion | None]] = []
        for assignment, activity in rows:
            completion = await self._completions.get(
                user_id=user_id,
                daily_activity_id=assignment.id,
            )
            history.append((assignment, activity, completion))
        return history

    async def complete_daily_activity(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> ActivityCompletion:
        return await self._record_outcome(
            user_id=user_id,
            team_id=team_id,
            outcome=CompletionOutcome.COMPLETED,
        )

    async def skip_daily_activity(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> ActivityCompletion:
        return await self._record_outcome(
            user_id=user_id,
            team_id=team_id,
            outcome=CompletionOutcome.SKIPPED,
        )

    async def _record_outcome(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
        outcome: CompletionOutcome,
    ) -> ActivityCompletion:
        await self._require_active_member(user_id=user_id, team_id=team_id)
        assignment = await self._get_or_create_today(team_id=team_id)
        existing = await self._completions.get(
            user_id=user_id,
            daily_activity_id=assignment.id,
        )
        if existing is not None:
            if existing.outcome == outcome:
                return existing
            raise ConflictError(
                code="already_responded",
                message="You already responded to today's activity.",
            )
        try:
            completion = await self._completions.create(
                user_id=user_id,
                daily_activity_id=assignment.id,
                outcome=outcome,
            )
            await self._completions.commit()
        except IntegrityError:
            await self._completions.rollback()
            existing = await self._completions.get(
                user_id=user_id,
                daily_activity_id=assignment.id,
            )
            if existing is None:
                raise
            if existing.outcome == outcome:
                return existing
            raise ConflictError(
                code="already_responded",
                message="You already responded to today's activity.",
            ) from None
        logger.info(
            "activity_%s team_id=%s user_id=%s assignment_id=%s",
            outcome.value,
            team_id,
            user_id,
            assignment.id,
        )
        return completion

    async def _get_or_create_today(self, *, team_id: uuid.UUID) -> DailyActivity:
        team = await self._teams.get_by_id(team_id=team_id)
        if team is None:
            raise NotFoundError(code="team_not_found", message="Team not found.")
        today = self._team_date(team)
        existing = await self._assignments.get_by_team_and_date(
            team_id=team_id,
            activity_date=today,
        )
        if existing is not None:
            return existing
        activity = await self._select_activity(team_id=team_id, on_date=today)
        try:
            created = await self._assignments.create(
                team_id=team_id,
                activity_id=activity.id,
                activity_date=today,
            )
            await self._assignments.commit()
        except IntegrityError:
            await self._assignments.rollback()
            existing = await self._assignments.get_by_team_and_date(
                team_id=team_id,
                activity_date=today,
            )
            if existing is None:
                raise
            return existing
        logger.info("daily_activity_assigned team_id=%s activity_date=%s", team_id, today)
        return created

    async def _select_activity(self, *, team_id: uuid.UUID, on_date: date) -> Activity:
        active = await self._activities.list_active()
        if not active:
            raise ConflictError(
                code="activity_library_empty",
                message="No activities are available.",
            )
        recent_ids = await self._assignments.recent_activity_ids(
            team_id=team_id,
            on_date=on_date,
            window_days=RECENT_ACTIVITY_WINDOW_DAYS,
        )
        eligible = [activity for activity in active if activity.id not in recent_ids]
        if not eligible:
            eligible = list(active)
        eligible.sort(key=lambda item: item.id.bytes)
        return eligible[on_date.toordinal() % len(eligible)]

    def _team_date(self, team: Team) -> date:
        return local_date(timezone_name=team.timezone, at=self._clock.now())

    async def _require_activity(self, *, activity_id: uuid.UUID) -> Activity:
        activity = await self._activities.get(activity_id=activity_id)
        if activity is None:
            raise NotFoundError(code="activity_not_found", message="Activity not found.")
        return activity

    async def _require_active_member(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> tuple[Team, TeamMembership]:
        found = await self._teams.get_team_for_active_member(team_id=team_id, user_id=user_id)
        if found is None:
            raise NotFoundError(code="team_not_found", message="Team not found.")
        return found
