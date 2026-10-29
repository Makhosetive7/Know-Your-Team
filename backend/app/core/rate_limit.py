from collections import defaultdict
from datetime import datetime

from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.clock import get_clock
from app.core.config import settings
from app.core.exceptions import RateLimitError

AUTH_RATE_LIMITED_PATHS = frozenset({"/api/v1/auth/login", "/api/v1/auth/register"})


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[datetime]] = defaultdict(list)

    def reset(self) -> None:
        self._hits.clear()

    def hit(self, *, key: str, limit: int, window_seconds: int, now: datetime) -> None:
        cutoff = now.timestamp() - window_seconds
        timestamps = [stamp for stamp in self._hits[key] if stamp.timestamp() > cutoff]
        if len(timestamps) >= limit:
            self._hits[key] = timestamps
            raise RateLimitError(retry_after=window_seconds)
        timestamps.append(now)
        self._hits[key] = timestamps


rate_limiter = InMemoryRateLimiter()


class AuthRateLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["method"] == "POST":
            path = scope.get("path", "")
            if path in AUTH_RATE_LIMITED_PATHS:
                client = scope.get("client")
                host = client[0] if client else "unknown"
                try:
                    rate_limiter.hit(
                        key=f"auth:{path}:{host}",
                        limit=settings.auth_rate_limit_max,
                        window_seconds=settings.auth_rate_limit_window_seconds,
                        now=get_clock().now(),
                    )
                except RateLimitError as exc:
                    response = JSONResponse(
                        status_code=exc.status_code,
                        content={"error": {"code": exc.code, "message": exc.message}},
                        headers={"Retry-After": str(exc.retry_after)},
                    )
                    await response(scope, receive, send)
                    return
        await self.app(scope, receive, send)
