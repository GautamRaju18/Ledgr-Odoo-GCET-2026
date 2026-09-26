from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StockQuant(Base):
    __tablename__ = "stock_quants"
    __table_args__ = (
        UniqueConstraint("product_id", "location_id"),
        # Last line of defence: the engine already rejects negative stock.
        CheckConstraint("quantity >= 0", name="stock_quant_qty_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
