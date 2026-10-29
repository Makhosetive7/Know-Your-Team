import logging
import uuid

from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.models import Team, TeamMembership, User
from app.models.team import MembershipRole, MembershipStatus
from app.repositories.team import TeamRepository

logger = logging.getLogger(__name__)


class TeamService:
    def __init__(self, teams: TeamRepository) -> None:
        self._teams = teams

    async def create_team(
        self,
        *,
        user_id: uuid.UUID,
        name: str,
        timezone: str,
    ) -> tuple[Team, TeamMembership]:
        team = await self._teams.create_team(name=name, timezone=timezone)
        membership = await self._teams.add_membership(
            team_id=team.id,
            user_id=user_id,
            role=MembershipRole.TEAM_ADMINISTRATOR,
        )
        await self._teams.commit()
        logger.info("team_created team_id=%s user_id=%s", team.id, user_id)
        return team, membership

    async def list_teams_for_user(
        self,
        *,
        user_id: uuid.UUID,
    ) -> list[tuple[Team, TeamMembership]]:
        return await self._teams.list_teams_for_user(user_id=user_id)

    async def get_team(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> tuple[Team, TeamMembership]:
        return await self._require_active_member(user_id=user_id, team_id=team_id)

    async def update_team(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
        fields_set: set[str],
        name: str | None,
        timezone: str | None,
    ) -> tuple[Team, TeamMembership]:
        team, membership = await self._require_administrator(user_id=user_id, team_id=team_id)
        if "name" in fields_set and name is not None:
            team.name = name
        if "timezone" in fields_set and timezone is not None:
            team.timezone = timezone
        await self._teams.commit()
        return team, membership

    async def list_members(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> list[tuple[TeamMembership, User]]:
        await self._require_active_member(user_id=user_id, team_id=team_id)
        return await self._teams.list_active_members(team_id=team_id)

    async def remove_or_leave(
        self,
        *,
        actor_id: uuid.UUID,
        team_id: uuid.UUID,
        target_user_id: uuid.UUID,
    ) -> None:
        actor_membership = await self._require_active_membership(
            user_id=actor_id,
            team_id=team_id,
        )
        if actor_id == target_user_id:
            await self._deactivate(
                membership=actor_membership,
                status=MembershipStatus.LEFT,
            )
            logger.info("team_left team_id=%s user_id=%s", team_id, actor_id)
            return

        if actor_membership.role != MembershipRole.TEAM_ADMINISTRATOR:
            raise PermissionDeniedError()

        target = await self._teams.get_active_membership(
            team_id=team_id,
            user_id=target_user_id,
        )
        if target is None:
            raise NotFoundError(code="member_not_found", message="Member not found.")

        await self._deactivate(membership=target, status=MembershipStatus.REMOVED)
        logger.info(
            "team_member_removed team_id=%s actor_id=%s target_user_id=%s",
            team_id,
            actor_id,
            target_user_id,
        )

    async def _require_administrator(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> tuple[Team, TeamMembership]:
        team, membership = await self._require_active_member(user_id=user_id, team_id=team_id)
        if membership.role != MembershipRole.TEAM_ADMINISTRATOR:
            raise PermissionDeniedError()
        return team, membership

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

    async def _require_active_membership(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> TeamMembership:
        _team, membership = await self._require_active_member(user_id=user_id, team_id=team_id)
        return membership

    async def _deactivate(
        self,
        *,
        membership: TeamMembership,
        status: MembershipStatus,
    ) -> None:
        if membership.role == MembershipRole.TEAM_ADMINISTRATOR:
            admin_count = await self._teams.count_active_administrators(team_id=membership.team_id)
            if admin_count <= 1:
                raise ConflictError(
                    code="last_administrator",
                    message="The last team administrator cannot leave or be removed.",
                )
        membership.status = status
        await self._teams.commit()
