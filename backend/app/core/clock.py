from datetime import datetime
from typing import Protocol

from app.core.timezones import utc_now


class Clock(Protocol):
    def now(self) -> datetime: ...


class SystemClock:
    def now(self) -> datetime:
        return utc_now()


_active_clock: Clock = SystemClock()


def get_clock() -> Clock:
    return _active_clock


def set_clock(clock: Clock) -> None:
    global _active_clock
    _active_clock = clock
