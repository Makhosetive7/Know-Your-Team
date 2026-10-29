from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppError, RateLimitError

_STATUS_DEFAULTS: dict[int, tuple[str, str]] = {
    401: ("unauthenticated", "Not authenticated."),
    403: ("permission_denied", "You do not have access to this resource."),
    404: ("not_found", "Resource not found."),
    409: ("conflict", "The request conflicts with existing state."),
    422: ("validation_error", "Request validation failed."),
    429: ("rate_limited", "Too many requests."),
}

_DETAIL_MAP: dict[str, tuple[int, str, str]] = {
    "REGISTER_USER_ALREADY_EXISTS": (
        409,
        "user_already_exists",
        "An account with this email already exists.",
    ),
    "LOGIN_BAD_CREDENTIALS": (
        401,
        "login_bad_credentials",
        "Incorrect email or password.",
    ),
    "LOGIN_USER_NOT_VERIFIED": (
        401,
        "login_bad_credentials",
        "Incorrect email or password.",
    ),
    "REGISTER_INVALID_PASSWORD": (
        400,
        "invalid_password",
        "Password does not meet the requirements.",
    ),
    "UPDATE_USER_INVALID_PASSWORD": (
        400,
        "invalid_password",
        "Password does not meet the requirements.",
    ),
}


def _error_body(*, code: str, message: str) -> dict[str, dict[str, str]]:
    return {"error": {"code": code, "message": message}}


def _from_detail(detail: object, status_code: int) -> tuple[int, str, str]:
    if isinstance(detail, dict):
        raw_code = detail.get("code")
        if isinstance(raw_code, str) and raw_code in _DETAIL_MAP:
            mapped_status, code, default_message = _DETAIL_MAP[raw_code]
            reason = detail.get("reason")
            message = reason if isinstance(reason, str) and reason else default_message
            return mapped_status, code, message
        if isinstance(raw_code, str):
            reason = detail.get("reason")
            message = reason if isinstance(reason, str) and reason else raw_code
            return status_code, raw_code.lower(), message

    if isinstance(detail, str) and detail in _DETAIL_MAP:
        return _DETAIL_MAP[detail]

    default_code, default_message = _STATUS_DEFAULTS.get(
        status_code,
        ("http_error", "Request failed."),
    )
    if isinstance(detail, str) and detail and detail not in {"Not authenticated", "Unauthorized"}:
        return status_code, default_code, detail
    return status_code, default_code, default_message


async def _http_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, StarletteHTTPException):
        raise exc
    status_code, code, message = _from_detail(exc.detail, exc.status_code)
    headers = dict(exc.headers) if exc.headers else None
    return JSONResponse(
        status_code=status_code,
        content=_error_body(code=code, message=message),
        headers=headers,
    )


async def _validation_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise exc
    return JSONResponse(
        status_code=422,
        content=_error_body(
            code="validation_error",
            message="Request validation failed.",
        ),
    )


async def _app_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, AppError):
        raise exc
    headers = None
    if isinstance(exc, RateLimitError):
        headers = {"Retry-After": str(exc.retry_after)}
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(code=exc.code, message=exc.message),
        headers=headers,
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)
    app.add_exception_handler(AppError, _app_error_handler)
