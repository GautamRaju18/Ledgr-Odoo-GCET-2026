from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.location import Location
    from app.models.picking import Picking
    from app.models.product import Product


class StockMove(Base):
    __tablename__ = "stock_moves"
    __table_args__ = (CheckConstraint("quantity > 0", name="stock_move_qty_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    picking_id: Mapped[int] = mapped_column(ForeignKey("pickings.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    source_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"))
    dest_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"))
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    picking: Mapped["Picking"] = relationship(lazy="selectin")
    product: Mapped["Product"] = relationship(lazy="selectin")
    source_location: Mapped["Location"] = relationship(
        foreign_keys=[source_location_id], lazy="selectin"
    )
    dest_location: Mapped["Location"] = relationship(
        foreign_keys=[dest_location_id], lazy="selectin"
    )
