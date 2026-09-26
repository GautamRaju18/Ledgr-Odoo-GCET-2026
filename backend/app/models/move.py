from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


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
