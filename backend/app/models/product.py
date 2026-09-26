from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.category import Category


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    sku: Mapped[str] = mapped_column(unique=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    uom: Mapped[str] = mapped_column(default="Units")
    per_unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    category: Mapped[Category | None] = relationship(lazy="selectin")
