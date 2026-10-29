class AppError(Exception):
    def __init__(self, *, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(
        self,
        *,
        code: str = "not_found",
        message: str = "Resource not found.",
    ) -> None:
        super().__init__(code=code, message=message, status_code=404)


class PermissionDeniedError(AppError):
    def __init__(
        self,
        *,
        code: str = "permission_denied",
        message: str = "You do not have access to this resource.",
    ) -> None:
        super().__init__(code=code, message=message, status_code=403)


class ConflictError(AppError):
    def __init__(
        self,
        *,
        code: str = "conflict",
        message: str = "The request conflicts with existing state.",
    ) -> None:
        super().__init__(code=code, message=message, status_code=409)


class RateLimitError(AppError):
    def __init__(
        self,
        *,
        retry_after: int,
        code: str = "rate_limited",
        message: str = "Too many requests.",
    ) -> None:
        super().__init__(code=code, message=message, status_code=429)
        self.retry_after = retry_after
