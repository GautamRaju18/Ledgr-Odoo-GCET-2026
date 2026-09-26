import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PickingType(str, enum.Enum):
    receipt = "receipt"
    delivery = "delivery"
    internal = "internal"
    adjustment = "adjustment"


class PickingStatus(str, enum.Enum):
    draft = "draft"
    waiting = "waiting"
    ready = "ready"
    done = "done"
    canceled = "canceled"


class Picking(Base):
    __tablename__ = "pickings"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(unique=True)
    type: Mapped[PickingType] = mapped_column(Enum(PickingType, name="picking_type"))
    status: Mapped[PickingStatus] = mapped_column(
        Enum(PickingStatus, name="picking_status"), default=PickingStatus.draft
    )
    partner_id: Mapped[int | None] = mapped_column(ForeignKey("partners.id"))
    source_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"))
    dest_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"))
    schedule_date: Mapped[date] = mapped_column(server_default=func.current_date())
    responsible_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    delivery_address: Mapped[str | None]
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    lines: Mapped[list["PickingLine"]] = relationship(
        back_populates="picking", cascade="all, delete-orphan"
    )


class PickingLine(Base):
    __tablename__ = "picking_lines"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="picking_line_qty_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    picking_id: Mapped[int] = mapped_column(
        ForeignKey("pickings.id", ondelete="CASCADE")
    )
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    picking: Mapped[Picking] = relationship(back_populates="lines")
