from datetime import datetime
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from app.deps import DB, get_current_user
from app.models.location import LocationType
from app.models.move import StockMove
from app.models.picking import Picking, PickingStatus, PickingType
from app.routers.pickings import Filters

router = APIRouter(
    prefix="/moves", tags=["moves"], dependencies=[Depends(get_current_user)]
)


class MoveOut(BaseModel):
    id: int
    picking_id: int
    reference: str
    type: PickingType
    status: PickingStatus
    date: datetime
    partner_name: str | None
    product_id: int
    product_name: str
    sku: str
    uom: str
    quantity: Decimal
    from_location: str
    to_location: str
    direction: Literal["in", "out", "internal"]  # in = green row, out = red row


def _direction(move: StockMove) -> str:
    src = move.source_location.type == LocationType.internal
    dst = move.dest_location.type == LocationType.internal
    return "internal" if src and dst else "out" if src else "in"


@router.get("", response_model=list[MoveOut])
def list_moves(db: DB, filters: Filters):
    query = filters.apply(select(StockMove).join(Picking).order_by(StockMove.id.desc()))
    return [
        MoveOut(
            id=m.id,
            picking_id=m.picking_id,
            reference=m.picking.reference,
            type=m.picking.type,
            status=m.picking.status,
            date=m.date,
            partner_name=m.picking.partner.name if m.picking.partner else None,
            product_id=m.product_id,
            product_name=m.product.name,
            sku=m.product.sku,
            uom=m.product.uom,
            quantity=m.quantity,
            from_location=m.source_location.full_name,
            to_location=m.dest_location.full_name,
            direction=_direction(m),
        )
        for m in db.scalars(query)
    ]
