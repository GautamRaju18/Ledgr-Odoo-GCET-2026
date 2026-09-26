from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PickingSequence(Base):
    __tablename__ = "sequences"
    __table_args__ = (UniqueConstraint("warehouse_id", "picking_type"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"))
    # Plain string (PickingType value): reusing the picking_type PG enum here
    # makes Alembic try to CREATE TYPE twice.
    picking_type: Mapped[str]
    next_number: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
