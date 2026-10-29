import logging
import uuid
from datetime import timedelta

from sqlalchemy.exc import IntegrityError

from app.core.clock import Clock
from app.core.config import (
    DEFAULT_INVITATION_TTL_DAYS,
    settings,
)
from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.core.rate_limit import rate_limiter
from app.core.timezones import as_utc
from app.core.tokens import hash_invitation_token, new_invitation_token
from app.models import Invitation, Team, TeamMembership
from app.models.team import MembershipRole, MembershipStatus
from app.repositories.invitation import InvitationRepository
from app.repositories.team import TeamRepository

logger = logging.getLogger(__name__)

_INVALID_INVITATION = NotFoundError(
    code="invitation_invalid",
    message="Invitation not found.",
)


class InvitationService:
    def __init__(
        self,
        invitations: InvitationRepository,
        teams: TeamRepository,
        clock: Clock,
    ) -> None:
        self._invitations = invitations
        self._teams = teams
        self._clock = clock

    async def create_invitation(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
        expires_in_days: int = DEFAULT_INVITATION_TTL_DAYS,
    ) -> tuple[Invitation, str]:
        await self._require_administrator(user_id=user_id, team_id=team_id)
        rate_limiter.hit(
            key=f"invitation_create:{user_id}",
            limit=settings.invitation_create_rate_limit_max,
            window_seconds=settings.invitation_create_rate_limit_window_seconds,
            now=self._clock.now(),
        )
        token = new_invitation_token()
        invitation = await self._invitations.create(
            team_id=team_id,
            created_by_user_id=user_id,
            token_hash=hash_invitation_token(token),
            expires_at=self._clock.now() + timedelta(days=expires_in_days),
        )
        await self._invitations.commit()
        logger.info("invitation_created team_id=%s user_id=%s", team_id, user_id)
        return invitation, token

    async def list_invitations(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> list[Invitation]:
        await self._require_administrator(user_id=user_id, team_id=team_id)
        return await self._invitations.list_for_team(team_id=team_id)

    async def revoke_invitation(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
        invitation_id: uuid.UUID,
    ) -> None:
        await self._require_administrator(user_id=user_id, team_id=team_id)
        invitation = await self._invitations.get_by_id(invitation_id=invitation_id)
        if invitation is None or invitation.team_id != team_id:
            raise NotFoundError(code="invitation_not_found", message="Invitation not found.")
        if invitation.revoked_at is None:
            invitation.revoked_at = self._clock.now()
            await self._invitations.commit()
            logger.info("invitation_revoked team_id=%s invitation_id=%s", team_id, invitation_id)

    async def preview_invitation(self, *, token: str) -> str:
        team = await self._usable_team(token=token)
        return team.name

    async def join_team(
        self,
        *,
        user_id: uuid.UUID,
        token: str,
    ) -> tuple[Team, TeamMembership]:
        rate_limiter.hit(
            key=f"invitation_join:{user_id}",
            limit=settings.invitation_join_rate_limit_max,
            window_seconds=settings.invitation_join_rate_limit_window_seconds,
            now=self._clock.now(),
        )
        team = await self._usable_team(token=token)
        existing = await self._teams.get_membership(team_id=team.id, user_id=user_id)
        if existing is not None and existing.status == MembershipStatus.ACTIVE:
            raise ConflictError(
                code="already_a_member",
                message="You are already a member of this team.",
            )
        if existing is not None:
            existing.status = MembershipStatus.ACTIVE
            existing.role = MembershipRole.MEMBER
            await self._teams.commit()
            logger.info("team_rejoined team_id=%s user_id=%s", team.id, user_id)
            return team, existing
        try:
            membership = await self._teams.add_membership(
                team_id=team.id,
                user_id=user_id,
                role=MembershipRole.MEMBER,
            )
            await self._teams.commit()
        except IntegrityError:
            await self._teams.rollback()
            raced = await self._teams.get_active_membership(team_id=team.id, user_id=user_id)
            if raced is None:
                raise
            raise ConflictError(
                code="already_a_member",
                message="You are already a member of this team.",
            ) from None
        logger.info("team_joined team_id=%s user_id=%s", team.id, user_id)
        return team, membership

    async def _usable_team(self, *, token: str) -> Team:
        found = await self._invitations.get_by_token_hash_with_team(
            token_hash=hash_invitation_token(token),
        )
        if found is None:
            raise _INVALID_INVITATION
        invitation, team = found
        if not self._is_usable(invitation):
            raise _INVALID_INVITATION
        return team

    def _is_usable(self, invitation: Invitation) -> bool:
        if invitation.revoked_at is not None:
            return False
        return as_utc(invitation.expires_at) > as_utc(self._clock.now())

    async def _require_administrator(
        self,
        *,
        user_id: uuid.UUID,
        team_id: uuid.UUID,
    ) -> None:
        found = await self._teams.get_team_for_active_member(team_id=team_id, user_id=user_id)
        if found is None:
            raise NotFoundError(code="team_not_found", message="Team not found.")
        _team, membership = found
        if membership.role != MembershipRole.TEAM_ADMINISTRATOR:
            raise PermissionDeniedError()
