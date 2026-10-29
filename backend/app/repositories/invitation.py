import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Invitation, Team


class InvitationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        team_id: uuid.UUID,
        created_by_user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> Invitation:
        invitation = Invitation(
            team_id=team_id,
            created_by_user_id=created_by_user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(invitation)
        await self._session.flush()
        return invitation

    async def get_by_id(self, *, invitation_id: uuid.UUID) -> Invitation | None:
        invitation = await self._session.get(Invitation, invitation_id)
        return invitation if isinstance(invitation, Invitation) else None

    async def get_by_token_hash_with_team(
        self,
        *,
        token_hash: str,
    ) -> tuple[Invitation, Team] | None:
        statement = (
            select(Invitation, Team)
            .join(Invitation.team)
            .where(Invitation.token_hash == token_hash)
        )
        result = await self._session.execute(statement)
        return result.tuples().first()

    async def list_for_team(self, *, team_id: uuid.UUID) -> list[Invitation]:
        statement = (
            select(Invitation)
            .where(Invitation.team_id == team_id)
            .order_by(Invitation.created_at.desc())
        )
        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()
