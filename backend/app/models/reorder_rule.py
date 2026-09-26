from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReorderRule(Base):
    __tablename__ = "reorder_rules"
    __table_args__ = (
        UniqueConstraint("product_id", "warehouse_id"),
        CheckConstraint("0 <= min_qty AND min_qty <= max_qty", name="reorder_min_max"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE")
    )
    warehouse_id: Mapped[int] = mapped_column(
        ForeignKey("warehouses.id", ondelete="CASCADE")
    )
    min_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    max_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
