import uuid

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, InvitationServiceDep
from app.models import Team, TeamMembership
from app.schemas.invitation import (
    InvitationCreate,
    InvitationCreated,
    InvitationPreview,
    InvitationRead,
    JoinTeamRequest,
)
from app.schemas.team import TeamRead

router = APIRouter()


def _team_read(team: Team, membership: TeamMembership) -> TeamRead:
    return TeamRead(
        id=team.id,
        name=team.name,
        timezone=team.timezone,
        role=membership.role,
        created_at=team.created_at,
    )


@router.get("/join", response_model=InvitationPreview)
async def preview_invitation(
    invitations: InvitationServiceDep,
    token: str = Query(min_length=1),
) -> InvitationPreview:
    team_name = await invitations.preview_invitation(token=token)
    return InvitationPreview(team_name=team_name)


@router.post("/join", response_model=TeamRead)
async def join_team(
    body: JoinTeamRequest,
    current_user: CurrentUser,
    invitations: InvitationServiceDep,
) -> TeamRead:
    team, membership = await invitations.join_team(user_id=current_user.id, token=body.token)
    return _team_read(team, membership)


@router.post(
    "/{team_id}/invitations",
    response_model=InvitationCreated,
    status_code=status.HTTP_201_CREATED,
)
async def create_invitation(
    team_id: uuid.UUID,
    body: InvitationCreate,
    current_user: CurrentUser,
    invitations: InvitationServiceDep,
) -> InvitationCreated:
    invitation, token = await invitations.create_invitation(
        user_id=current_user.id,
        team_id=team_id,
        expires_in_days=body.expires_in_days,
    )
    return InvitationCreated(
        id=invitation.id,
        token=token,
        expires_at=invitation.expires_at,
        revoked_at=invitation.revoked_at,
    )


@router.get("/{team_id}/invitations", response_model=list[InvitationRead])
async def list_invitations(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    invitations: InvitationServiceDep,
) -> list[InvitationRead]:
    rows = await invitations.list_invitations(user_id=current_user.id, team_id=team_id)
    return [
        InvitationRead(
            id=row.id,
            expires_at=row.expires_at,
            revoked_at=row.revoked_at,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post(
    "/{team_id}/invitations/{invitation_id}/revoke",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_invitation(
    team_id: uuid.UUID,
    invitation_id: uuid.UUID,
    current_user: CurrentUser,
    invitations: InvitationServiceDep,
) -> None:
    await invitations.revoke_invitation(
        user_id=current_user.id,
        team_id=team_id,
        invitation_id=invitation_id,
    )
