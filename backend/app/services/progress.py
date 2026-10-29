import uuid
from dataclasses import dataclass
from datetime import date

from app.core.clock import Clock
from app.core.exceptions import NotFoundError
from app.core.timezones import local_date
from app.models import Activity, DailyActivity, Team
from app.models.activity import CompletionOutcome
from app.repositories.activity import (
    ActivityRepository,
    AssignmentRepository,
    CompletionRepository,
)
from app.repositories.team import TeamRepository


def participation_percent(*, completed_count: int, member_count: int) -> int:
    if member_count == 0:
        return 0
    return round((completed_count / member_count) * 100)


@dataclass(frozen=True)
class TeamProgressSnapshot:
    activity_date: date
    member_count: int
    completed_count: int
    skipped_count: int
    participation_percent: int
    assignment: DailyActivity | None
    activity: Activity | None


class ProgressService:
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

    async def get_today(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> TeamProgressSnapshot:
        team = await self._require_team(user_id=user_id, team_id=team_id)
        today = local_date(timezone_name=team.timezone, at=self._clock.now())
        assignment = await self._assignments.get_by_team_and_date(
            team_id=team_id,
            activity_date=today,
        )
        return await self._snapshot(
            team_id=team_id,
            activity_date=today,
            assignment=assignment,
        )

    async def list_history(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
        limit: int,
    ) -> list[TeamProgressSnapshot]:
        await self._require_team(user_id=user_id, team_id=team_id)
        rows = await self._assignments.list_for_team(team_id=team_id, limit=limit)
        history: list[TeamProgressSnapshot] = []
        for assignment, activity in rows:
            snapshot = await self._snapshot(
                team_id=team_id,
                activity_date=assignment.activity_date,
                assignment=assignment,
                activity=activity,
            )
            history.append(snapshot)
        return history

    async def _snapshot(
        self,
        *,
        team_id: uuid.UUID,
        activity_date: date,
        assignment: DailyActivity | None,
        activity: Activity | None = None,
    ) -> TeamProgressSnapshot:
        member_ids = await self._teams.list_active_member_ids(team_id=team_id)
        member_count = len(member_ids)
        if assignment is None:
            return TeamProgressSnapshot(
                activity_date=activity_date,
                member_count=member_count,
                completed_count=0,
                skipped_count=0,
                participation_percent=0,
                assignment=None,
                activity=None,
            )
        if activity is None:
            activity = await self._activities.get(activity_id=assignment.activity_id)
        completed_count = await self._completions.count_for_assignment(
            daily_activity_id=assignment.id,
            outcome=CompletionOutcome.COMPLETED,
            user_ids=member_ids,
        )
        skipped_count = await self._completions.count_for_assignment(
            daily_activity_id=assignment.id,
            outcome=CompletionOutcome.SKIPPED,
            user_ids=member_ids,
        )
        return TeamProgressSnapshot(
            activity_date=activity_date,
            member_count=member_count,
            completed_count=completed_count,
            skipped_count=skipped_count,
            participation_percent=participation_percent(
                completed_count=completed_count,
                member_count=member_count,
            ),
            assignment=assignment,
            activity=activity,
        )

    async def _require_team(self, *, user_id: uuid.UUID, team_id: uuid.UUID) -> Team:
        found = await self._teams.get_team_for_active_member(team_id=team_id, user_id=user_id)
        if found is None:
            raise NotFoundError(code="team_not_found", message="Team not found.")
        team, _membership = found
        return team
