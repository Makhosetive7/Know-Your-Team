from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def utc_now() -> datetime:
    return datetime.now(UTC)


def parse_timezone(name: str) -> ZoneInfo:
    stripped = name.strip()
    if not stripped:
        raise ValueError("Unknown timezone.")
    try:
        return ZoneInfo(stripped)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError("Unknown timezone.") from exc


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def local_date(*, timezone_name: str, at: datetime) -> date:
    zone = parse_timezone(timezone_name)
    aware = at if at.tzinfo is not None else at.replace(tzinfo=UTC)
    return aware.astimezone(zone).date()
