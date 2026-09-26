import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.warehouse import Warehouse


class LocationType(str, enum.Enum):
    internal = "internal"
    vendor = "vendor"
    customer = "customer"
    inventory_loss = "inventory_loss"


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    short_code: Mapped[str | None]
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"))
    type: Mapped[LocationType] = mapped_column(
        Enum(LocationType, name="location_type"), default=LocationType.internal
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    warehouse: Mapped[Warehouse | None] = relationship(lazy="selectin")

    @property
    def full_name(self) -> str:
        """e.g. WH/Stock; virtual locations have no warehouse prefix."""
        prefix = f"{self.warehouse.short_code}/" if self.warehouse else ""
        return prefix + self.name
