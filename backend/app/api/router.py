from fastapi import APIRouter

from app.api.activities import router as activities_router
from app.api.admin import router as admin_router
from app.api.invitations import router as invitations_router
from app.api.progress import router as progress_router
from app.api.teams import router as teams_router
from app.api.users import router as users_router
from app.core.users import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead

api_router = APIRouter()

api_router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["auth"],
)
api_router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(invitations_router, prefix="/teams", tags=["invitations"])
api_router.include_router(teams_router, prefix="/teams", tags=["teams"])
api_router.include_router(activities_router, prefix="/teams", tags=["activities"])
api_router.include_router(progress_router, prefix="/teams", tags=["progress"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
