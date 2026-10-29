import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, TeamServiceDep
from app.models import Team, TeamMembership, User
from app.schemas.team import TeamCreate, TeamMemberRead, TeamRead, TeamUpdate

router = APIRouter()


def _team_read(team: Team, membership: TeamMembership) -> TeamRead:
    return TeamRead(
        id=team.id,
        name=team.name,
        timezone=team.timezone,
        role=membership.role,
        created_at=team.created_at,
    )


def _member_read(membership: TeamMembership, user: User) -> TeamMemberRead:
    return TeamMemberRead(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=membership.role,
    )


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def create_team(
    body: TeamCreate,
    current_user: CurrentUser,
    teams: TeamServiceDep,
) -> TeamRead:
    team, membership = await teams.create_team(
        user_id=current_user.id,
        name=body.name,
        timezone=body.timezone,
    )
    return _team_read(team, membership)


@router.get("", response_model=list[TeamRead])
async def list_teams(
    current_user: CurrentUser,
    teams: TeamServiceDep,
) -> list[TeamRead]:
    rows = await teams.list_teams_for_user(user_id=current_user.id)
    return [_team_read(team, membership) for team, membership in rows]


@router.patch("/{team_id}", response_model=TeamRead)
async def update_team(
    team_id: uuid.UUID,
    body: TeamUpdate,
    current_user: CurrentUser,
    teams: TeamServiceDep,
) -> TeamRead:
    team, membership = await teams.update_team(
        user_id=current_user.id,
        team_id=team_id,
        fields_set=body.model_fields_set,
        name=body.name,
        timezone=body.timezone,
    )
    return _team_read(team, membership)


@router.get("/{team_id}", response_model=TeamRead)
async def get_team(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    teams: TeamServiceDep,
) -> TeamRead:
    team, membership = await teams.get_team(user_id=current_user.id, team_id=team_id)
    return _team_read(team, membership)


@router.get("/{team_id}/members", response_model=list[TeamMemberRead])
async def list_members(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    teams: TeamServiceDep,
) -> list[TeamMemberRead]:
    rows = await teams.list_members(user_id=current_user.id, team_id=team_id)
    return [_member_read(membership, user) for membership, user in rows]


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_or_leave_member(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    teams: TeamServiceDep,
) -> None:
    await teams.remove_or_leave(
        actor_id=current_user.id,
        team_id=team_id,
        target_user_id=user_id,
    )
