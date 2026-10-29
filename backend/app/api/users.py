from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    body: UserUpdate,
    current_user: CurrentUser,
    session: DbSession,
) -> UserRead:
    if "display_name" in body.model_fields_set:
        current_user.display_name = body.display_name
        await session.commit()
        await session.refresh(current_user)
    return UserRead.model_validate(current_user)
