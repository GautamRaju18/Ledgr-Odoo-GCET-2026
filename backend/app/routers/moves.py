from datetime import datetime, time
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from app.deps import DB, get_current_user
from app.models.location import Location, LocationType
from app.models.move import StockMove
from app.models.picking import Picking, PickingLine, PickingStatus, PickingType
from app.models.product import Product
from app.routers.pickings import Filters
from app.services.stock_engine import OPEN

router = APIRouter(
    prefix="/moves", tags=["moves"], dependencies=[Depends(get_current_user)]
)


class MoveOut(BaseModel):
    id: str  # "move-<id>" for done stock moves, "line-<id>" for planned lines
    picking_id: int
    reference: str
    type: PickingType
    status: PickingStatus
    date: datetime  # when stock moved; for planned lines, the schedule date
    partner_name: str | None
    product_id: int
    product_name: str
    sku: str
    uom: str
    quantity: Decimal
    from_location: str
    to_location: str
    direction: Literal["in", "out", "internal"]  # in = green row, out = red row


def _row(
    key: str,
    picking: Picking,
    product: Product,
    quantity: Decimal,
    src: Location,
    dst: Location,
    date: datetime,
) -> MoveOut:
    src_internal = src.type == LocationType.internal
    dst_internal = dst.type == LocationType.internal
    return MoveOut(
        id=key,
        picking_id=picking.id,
        reference=picking.reference,
        type=picking.type,
        status=picking.status,
        date=date,
        partner_name=picking.partner.name if picking.partner else None,
        product_id=product.id,
        product_name=product.name,
        sku=product.sku,
        uom=product.uom,
        quantity=quantity,
        from_location=src.full_name,
        to_location=dst.full_name,
        direction="internal"
        if src_internal and dst_internal
        else "out"
        if src_internal
        else "in",
    )


@router.get("", response_model=list[MoveOut])
def list_moves(db: DB, filters: Filters):
    """Planned lines of open operations first, then done stock moves (the ledger).

    Only done rows changed stock; planned rows (draft/waiting/ready) show what is coming.
    """
    planned = filters.apply(
        select(PickingLine)
        .join(Picking)
        .where(Picking.status.in_(OPEN))
        .order_by(Picking.id.desc(), PickingLine.id)
    )
    done = filters.apply(select(StockMove).join(Picking).order_by(StockMove.id.desc()))
    return [
        *(
            _row(
                f"line-{line.id}",
                line.picking,
                line.product,
                line.quantity,
                line.picking.source_location,
                line.picking.dest_location,
                datetime.combine(line.picking.schedule_date, time.min),
            )
            for line in db.scalars(planned)
        ),
        *(
            _row(
                f"move-{m.id}",
                m.picking,
                m.product,
                m.quantity,
                m.source_location,
                m.dest_location,
                m.date,
            )
            for m in db.scalars(done)
        ),
    ]
