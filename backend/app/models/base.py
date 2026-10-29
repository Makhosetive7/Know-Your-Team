from enum import StrEnum

from sqlalchemy import Enum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def str_enum_column(enum_cls: type[StrEnum], *, length: int) -> Enum:
    return Enum(
        enum_cls,
        name=enum_cls.__name__.lower(),
        values_callable=lambda members: [item.value for item in members],
        native_enum=False,
        length=length,
    )
