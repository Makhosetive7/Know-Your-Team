import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.router import api_router
from app.core.config import settings
from app.core.error_handlers import register_error_handlers
from app.core.rate_limit import AuthRateLimitMiddleware


def create_app() -> FastAPI:
    logging.basicConfig(level=settings.log_level.upper())

    app = FastAPI(title="Know Your Team API")
    register_error_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(AuthRateLimitMiddleware)
    app.include_router(health_router)
    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
