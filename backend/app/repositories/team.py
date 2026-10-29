import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Team, TeamMembership, User
from app.models.team import MembershipRole, MembershipStatus


class TeamRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_team(self, *, name: str, timezone: str) -> Team:
        team = Team(name=name, timezone=timezone)
        self._session.add(team)
        await self._session.flush()
        return team

    async def add_membership(
        self,
        *,
        team_id: uuid.UUID,
        user_id: uuid.UUID,
        role: MembershipRole,
        status: MembershipStatus = MembershipStatus.ACTIVE,
    ) -> TeamMembership:
        membership = TeamMembership(
            team_id=team_id,
            user_id=user_id,
            role=role,
            status=status,
        )
        self._session.add(membership)
        await self._session.flush()
        return membership

    async def get_team_for_active_member(
        self,
        *,
        team_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> tuple[Team, TeamMembership] | None:
        statement = (
            select(Team, TeamMembership)
            .join(TeamMembership, TeamMembership.team_id == Team.id)
            .where(
                Team.id == team_id,
                TeamMembership.user_id == user_id,
                TeamMembership.status == MembershipStatus.ACTIVE,
            )
        )
        result = await self._session.execute(statement)
        return result.tuples().first()

    async def get_active_membership(
        self,
        *,
        team_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> TeamMembership | None:
        statement = select(TeamMembership).where(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == user_id,
            TeamMembership.status == MembershipStatus.ACTIVE,
        )
        membership = await self._session.scalar(statement)
        return membership if isinstance(membership, TeamMembership) else None

    async def list_teams_for_user(
        self,
        *,
        user_id: uuid.UUID,
    ) -> list[tuple[Team, TeamMembership]]:
        statement = (
            select(Team, TeamMembership)
            .join(TeamMembership, TeamMembership.team_id == Team.id)
            .where(
                TeamMembership.user_id == user_id,
                TeamMembership.status == MembershipStatus.ACTIVE,
            )
            .order_by(Team.name)
        )
        result = await self._session.execute(statement)
        return list(result.tuples().all())

    async def list_active_members(
        self,
        *,
        team_id: uuid.UUID,
    ) -> list[tuple[TeamMembership, User]]:
        statement = (
            select(TeamMembership, User)
            .join(TeamMembership.user)
            .where(
                TeamMembership.team_id == team_id,
                TeamMembership.status == MembershipStatus.ACTIVE,
            )
            .order_by(TeamMembership.created_at)
        )
        result = await self._session.execute(statement)
        return list(result.tuples().all())

    async def get_by_id(self, *, team_id: uuid.UUID) -> Team | None:
        team = await self._session.get(Team, team_id)
        return team if isinstance(team, Team) else None

    async def get_membership(
        self,
        *,
        team_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> TeamMembership | None:
        statement = select(TeamMembership).where(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == user_id,
        )
        membership = await self._session.scalar(statement)
        return membership if isinstance(membership, TeamMembership) else None

    async def list_active_member_ids(self, *, team_id: uuid.UUID) -> list[uuid.UUID]:
        statement = select(TeamMembership.user_id).where(
            TeamMembership.team_id == team_id,
            TeamMembership.status == MembershipStatus.ACTIVE,
        )
        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def count_active_members(self, *, team_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TeamMembership)
            .where(
                TeamMembership.team_id == team_id,
                TeamMembership.status == MembershipStatus.ACTIVE,
            )
        )
        count = await self._session.scalar(statement)
        return int(count or 0)

    async def count_active_administrators(self, *, team_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TeamMembership)
            .where(
                TeamMembership.team_id == team_id,
                TeamMembership.status == MembershipStatus.ACTIVE,
                TeamMembership.role == MembershipRole.TEAM_ADMINISTRATOR,
            )
        )
        count = await self._session.scalar(statement)
        return int(count or 0)

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()
