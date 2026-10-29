from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import Clock, get_clock
from app.core.db import get_async_session
from app.core.users import current_active_user, current_superuser
from app.models import User
from app.repositories.activity import (
    ActivityRepository,
    AssignmentRepository,
    CompletionRepository,
)
from app.repositories.invitation import InvitationRepository
from app.repositories.team import TeamRepository
from app.services.activity import ActivityLibraryService
from app.services.daily_activity import DailyActivityService
from app.services.invitation import InvitationService
from app.services.progress import ProgressService
from app.services.team import TeamService

CurrentUser = Annotated[User, Depends(current_active_user)]
CurrentSuperuser = Annotated[User, Depends(current_superuser)]
DbSession = Annotated[AsyncSession, Depends(get_async_session)]
ClockDep = Annotated[Clock, Depends(get_clock)]


def get_team_service(session: DbSession) -> TeamService:
    return TeamService(TeamRepository(session))


def get_invitation_service(session: DbSession, clock: ClockDep) -> InvitationService:
    return InvitationService(
        invitations=InvitationRepository(session),
        teams=TeamRepository(session),
        clock=clock,
    )


def get_daily_activity_service(session: DbSession, clock: ClockDep) -> DailyActivityService:
    return DailyActivityService(
        teams=TeamRepository(session),
        activities=ActivityRepository(session),
        assignments=AssignmentRepository(session),
        completions=CompletionRepository(session),
        clock=clock,
    )


def get_progress_service(session: DbSession, clock: ClockDep) -> ProgressService:
    return ProgressService(
        teams=TeamRepository(session),
        activities=ActivityRepository(session),
        assignments=AssignmentRepository(session),
        completions=CompletionRepository(session),
        clock=clock,
    )


def get_activity_library_service(session: DbSession) -> ActivityLibraryService:
    return ActivityLibraryService(ActivityRepository(session))


TeamServiceDep = Annotated[TeamService, Depends(get_team_service)]
InvitationServiceDep = Annotated[InvitationService, Depends(get_invitation_service)]
DailyActivityServiceDep = Annotated[DailyActivityService, Depends(get_daily_activity_service)]
ProgressServiceDep = Annotated[ProgressService, Depends(get_progress_service)]
ActivityLibraryServiceDep = Annotated[ActivityLibraryService, Depends(get_activity_library_service)]
