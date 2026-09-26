from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.deps import DB, CurrentUser, get_current_user
from app.models.location import Location
from app.models.partner import Partner
from app.models.picking import Picking, PickingLine, PickingStatus, PickingType
from app.models.product import Product
from app.services import stock_engine as engine

router = APIRouter(
    prefix="/pickings", tags=["pickings"], dependencies=[Depends(get_current_user)]
)


class LineIn(BaseModel):
    product_id: int
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class PickingFields(BaseModel):
    partner_id: int | None = None
    source_location_id: int | None = None
    dest_location_id: int | None = None
    schedule_date: date | None = None
    delivery_address: str | None = None
    lines: list[LineIn] = []


class PickingCreate(PickingFields):
    type: PickingType


class LineOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: Decimal
    available: bool | None = None  # deliveries only; False = show the line red


class PickingOut(BaseModel):
    id: int
    reference: str
    type: PickingType
    status: PickingStatus
    partner_id: int | None
    partner_name: str | None
    source_location_id: int
    source_location_name: str
    dest_location_id: int
    dest_location_name: str
    schedule_date: date
    responsible_id: int
    responsible_name: str
    delivery_address: str | None
    done_at: datetime | None
    lines: list[LineOut]


@dataclass
class PickingFilters:
    """Query-string filters shared by operations lists, move history and dashboard."""

    type: PickingType | None = None
    status: PickingStatus | None = None
    warehouse_id: int | None = None
    location_id: int | None = None
    category_id: int | None = None
    search: str | None = None  # reference or contact name

    def apply(self, query):
        if self.type:
            query = query.where(Picking.type == self.type)
        if self.status:
            query = query.where(Picking.status == self.status)
        if self.location_id:
            query = query.where(
                or_(
                    Picking.source_location_id == self.location_id,
                    Picking.dest_location_id == self.location_id,
                )
            )
        if self.warehouse_id:
            in_warehouse = select(Location.id).where(
                Location.warehouse_id == self.warehouse_id
            )
            query = query.where(
                or_(
                    Picking.source_location_id.in_(in_warehouse),
                    Picking.dest_location_id.in_(in_warehouse),
                )
            )
        if self.category_id:
            query = query.where(
                Picking.id.in_(
                    select(PickingLine.picking_id)
                    .join(Product)
                    .where(Product.category_id == self.category_id)
                )
            )
        if self.search:
            pattern = f"%{self.search}%"
            query = query.where(
                or_(
                    Picking.reference.ilike(pattern),
                    Picking.partner_id.in_(
                        select(Partner.id).where(Partner.name.ilike(pattern))
                    ),
                )
            )
        return query


Filters = Annotated[PickingFilters, Depends()]


def _out(p: Picking, available: dict[int, bool] | None = None) -> PickingOut:
    available = available or {}
    return PickingOut(
        id=p.id,
        reference=p.reference,
        type=p.type,
        status=p.status,
        partner_id=p.partner_id,
        partner_name=p.partner.name if p.partner else None,
        source_location_id=p.source_location_id,
        source_location_name=p.source_location.full_name,
        dest_location_id=p.dest_location_id,
        dest_location_name=p.dest_location.full_name,
        schedule_date=p.schedule_date,
        responsible_id=p.responsible_id,
        responsible_name=p.responsible.name,
        delivery_address=p.delivery_address,
        done_at=p.done_at,
        lines=[
            LineOut(
                id=line.id,
                product_id=line.product_id,
                product_name=line.product.name,
                quantity=line.quantity,
                available=available.get(line.product_id),
            )
            for line in p.lines
        ],
    )


def _get(db: Session, picking_id: int, lock: bool = False) -> Picking:
    picking = db.get(Picking, picking_id, with_for_update=lock, populate_existing=lock)
    if picking is None:
        raise HTTPException(404, "Operation not found")
    return picking


@router.get("", response_model=list[PickingOut])
def list_pickings(db: DB, filters: Filters):
    query = filters.apply(select(Picking).order_by(Picking.id.desc()))
    return [_out(p) for p in db.scalars(query)]


@router.post("", response_model=PickingOut, status_code=201)
def create_picking(
    body: PickingCreate,
    db: DB,
    user: CurrentUser,
):
    picking = engine.create_picking(
        db, body.type, user.id, **body.model_dump(exclude={"type"})
    )
    db.commit()
    return _out(picking, engine.availability(db, picking))


@router.get("/{picking_id}", response_model=PickingOut)
def get_picking(picking_id: int, db: DB):
    picking = _get(db, picking_id)
    return _out(picking, engine.availability(db, picking))


@router.put("/{picking_id}", response_model=PickingOut)
def update_picking(picking_id: int, body: PickingFields, db: DB):
    picking = _get(db, picking_id, lock=True)
    engine.update_picking(db, picking, **body.model_dump())
    db.commit()
    return _out(picking, engine.availability(db, picking))


ACTIONS = {
    "todo": engine.todo,
    "check-availability": engine.check_availability,
    "validate": engine.validate,
    "cancel": engine.cancel,
}


@router.post("/{picking_id}/{action}", response_model=PickingOut)
def run_action(
    picking_id: int,
    action: Literal["todo", "check-availability", "validate", "cancel"],
    db: DB,
):
    picking = _get(db, picking_id, lock=True)
    available = ACTIONS[action](db, picking) or {}
    db.commit()
    return _out(picking, available)
