"""Stock engine: the only code that changes stock_quants.

Every stock change is a stock_moves row between two locations. Functions never
commit: the caller commits or rolls back the whole unit of work.
"""

from collections import defaultdict
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.move import StockMove
from app.models.partner import Partner
from app.models.picking import Picking, PickingLine, PickingStatus, PickingType
from app.models.product import Product
from app.models.quant import StockQuant
from app.models.warehouse import Warehouse
from app.services.sequence import next_reference

S = PickingStatus
OPEN = (S.draft, S.waiting, S.ready)


class StockError(HTTPException):
    def __init__(self, detail: str, status_code: int = 409):
        super().__init__(status_code, detail)


def _kind(location: Location) -> str:
    return getattr(location.type, "value", location.type)


def _virtual(db: Session, kind: str) -> Location:
    location = db.scalars(select(Location).where(Location.type == kind)).first()
    if location is None:
        raise StockError(f"No {kind} location exists; run the seed script", 500)
    return location


def _internal(db: Session, location_id: int | None, label: str) -> Location:
    location = db.get(Location, location_id) if location_id else None
    if location is None or _kind(location) != "internal":
        raise StockError(f"{label} must be a warehouse location", 400)
    return location


def _require(picking: Picking, *statuses: PickingStatus) -> None:
    if picking.status not in statuses:
        raise StockError(f"Not allowed while the operation is {picking.status.value}")


def _locked_quant(db: Session, product_id: int, location_id: int) -> StockQuant:
    db.execute(
        insert(StockQuant)
        .values(product_id=product_id, location_id=location_id, quantity=0)
        .on_conflict_do_nothing()
    )
    return db.scalars(
        select(StockQuant)
        .filter_by(product_id=product_id, location_id=location_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).one()


def _move(
    db: Session,
    picking: Picking,
    product_id: int,
    qty: Decimal,
    src: Location,
    dst: Location,
) -> None:
    # Only internal locations hold stock; vendor/customer/loss are virtual.
    if _kind(src) == "internal":
        quant = _locked_quant(db, product_id, src.id)
        if quant.quantity < qty:
            name = db.get(Product, product_id).name
            raise StockError(
                f"Not enough {name} at {src.name}: "
                f"{quant.quantity} on hand, {qty} needed"
            )
        quant.quantity -= qty
    if _kind(dst) == "internal":
        _locked_quant(db, product_id, dst.id).quantity += qty
    db.add(
        StockMove(
            picking_id=picking.id,
            product_id=product_id,
            quantity=qty,
            source_location_id=src.id,
            dest_location_id=dst.id,
        )
    )


def reserved(
    db: Session, exclude_picking_id: int | None = None
) -> dict[tuple[int, int], Decimal]:
    """Quantity promised by ready deliveries/transfers, keyed (product_id, location_id).

    Free to use = on hand - reserved.
    """
    rows = db.execute(
        select(
            PickingLine.product_id,
            Picking.source_location_id,
            func.sum(PickingLine.quantity),
        )
        .join(Picking)
        .where(
            Picking.status == S.ready,
            Picking.type.in_([PickingType.delivery, PickingType.internal]),
            Picking.id != exclude_picking_id,
        )
        .group_by(PickingLine.product_id, Picking.source_location_id)
    )
    return {(product, location): qty for product, location, qty in rows}


def availability(db: Session, picking: Picking) -> dict[int, bool]:
    """product_id -> does free-to-use stock at the source cover this delivery?"""
    if picking.type != PickingType.delivery or picking.status not in OPEN:
        return {}
    need: dict[int, Decimal] = defaultdict(Decimal)
    for line in picking.lines:
        need[line.product_id] += line.quantity
    src = picking.source_location_id
    on_hand = dict(
        db.execute(
            select(StockQuant.product_id, StockQuant.quantity).where(
                StockQuant.location_id == src, StockQuant.product_id.in_(need)
            )
        ).all()
    )
    held = reserved(db, picking.id)
    return {
        product: on_hand.get(product, 0) - held.get((product, src), 0) >= qty
        for product, qty in need.items()
    }


def update_picking(
    db: Session,
    picking: Picking,
    *,
    source_location_id: int | None,
    dest_location_id: int | None,
    lines: list[dict],
    partner_id: int | None = None,
    schedule_date: date | None = None,
    delivery_address: str | None = None,
) -> None:
    _require(picking, S.draft)
    if picking.type == PickingType.receipt:
        src = _virtual(db, "vendor")
        dst = _internal(db, dest_location_id, "Destination")
    elif picking.type == PickingType.delivery:
        src = _internal(db, source_location_id, "Source")
        dst = _virtual(db, "customer")
    else:
        src = _internal(db, source_location_id, "Source")
        dst = _internal(db, dest_location_id, "Destination")
        if src.id == dst.id:
            raise StockError("Source and destination must be different", 400)
    if partner_id and db.get(Partner, partner_id) is None:
        raise StockError("Contact not found", 400)
    product_ids = {line["product_id"] for line in lines}
    found = set(db.scalars(select(Product.id).where(Product.id.in_(product_ids))))
    if product_ids - found:
        raise StockError("Product not found", 400)

    picking.source_location_id, picking.dest_location_id = src.id, dst.id
    picking.partner_id = partner_id
    picking.delivery_address = delivery_address
    if schedule_date:
        picking.schedule_date = schedule_date
    picking.lines = [PickingLine(**line) for line in lines]


def create_picking(db: Session, type: PickingType, user_id: int, **fields) -> Picking:
    if type == PickingType.adjustment:
        raise StockError("Adjustments are made from the Stock page", 400)
    picking = Picking(type=type, status=S.draft, responsible_id=user_id)
    update_picking(db, picking, **fields)
    # Receipts belong to the destination's warehouse, others to the source's.
    location_id = (
        picking.dest_location_id
        if type == PickingType.receipt
        else picking.source_location_id
    )
    warehouse = db.get(Warehouse, db.get(Location, location_id).warehouse_id)
    picking.reference = next_reference(db, warehouse, type)
    db.add(picking)
    db.flush()
    return picking


def _assign(db: Session, picking: Picking) -> dict[int, bool]:
    # ponytail: reservation isn't locked, so two concurrent To Dos can both go
    # ready on the same stock; validate still refuses to go negative.
    available = availability(db, picking)
    picking.status = S.ready if all(available.values()) else S.waiting
    return available


def todo(db: Session, picking: Picking) -> dict[int, bool]:
    _require(picking, S.draft)
    if not picking.lines:
        raise StockError("Add at least one product line", 400)
    if picking.type == PickingType.delivery:
        return _assign(db, picking)
    picking.status = S.ready
    return {}


def check_availability(db: Session, picking: Picking) -> dict[int, bool]:
    _require(picking, S.waiting)
    return _assign(db, picking)


def validate(db: Session, picking: Picking) -> None:
    _require(picking, S.ready)
    src, dst = picking.source_location, picking.dest_location
    # Fixed lock order across transactions avoids deadlocks.
    for line in sorted(picking.lines, key=lambda line: line.product_id):
        _move(db, picking, line.product_id, line.quantity, src, dst)
    picking.status = S.done
    picking.done_at = datetime.now(UTC)


def cancel(db: Session, picking: Picking) -> None:
    _require(picking, *OPEN)
    picking.status = S.canceled


def adjust(
    db: Session, product_id: int, location_id: int, counted: Decimal, user_id: int
) -> Picking | None:
    """Set on-hand to the counted quantity via a done ADJ picking. None if no change."""
    location = _internal(db, location_id, "Location")
    if db.get(Product, product_id) is None:
        raise StockError("Product not found", 400)
    if counted < 0:
        raise StockError("Counted quantity cannot be negative", 400)
    diff = counted - _locked_quant(db, product_id, location_id).quantity
    if diff == 0:
        return None
    loss = _virtual(db, "inventory_loss")
    src, dst = (loss, location) if diff > 0 else (location, loss)
    picking = Picking(
        reference=next_reference(
            db, db.get(Warehouse, location.warehouse_id), PickingType.adjustment
        ),
        type=PickingType.adjustment,
        status=S.done,
        source_location_id=src.id,
        dest_location_id=dst.id,
        responsible_id=user_id,
        done_at=datetime.now(UTC),
        lines=[PickingLine(product_id=product_id, quantity=abs(diff))],
    )
    db.add(picking)
    db.flush()
    _move(db, picking, product_id, abs(diff), src, dst)
    return picking
