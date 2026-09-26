from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select

from app.deps import DB, get_current_user
from app.models.picking import Picking, PickingType
from app.routers.pickings import Filters
from app.services.stock_engine import OPEN
from app.services.stock_query import on_hand_totals, stock_alerts

router = APIRouter(
    prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)]
)


class OperationCard(BaseModel):
    pending: int = 0  # not done or canceled: "N to receive / to deliver"
    late: int = 0  # scheduled before today
    waiting: int = 0  # deliveries short of stock
    upcoming: int = 0  # scheduled after today ("operations")


class KpisOut(BaseModel):
    total_products_in_stock: int
    low_stock: int
    out_of_stock: int
    pending_receipts: int
    pending_deliveries: int
    internal_transfers_scheduled: int
    receipts: OperationCard
    deliveries: OperationCard
    internal: OperationCard


@router.get("/kpis", response_model=KpisOut)
def kpis(db: DB, filters: Filters):
    # Product KPIs are global; the filters narrow the operation counts.
    low, out = stock_alerts(db)
    cards = {t: OperationCard() for t in PickingType}
    today = func.current_date()  # same clock as the schedule_date default
    open_pickings = filters.apply(
        select(
            Picking.type,
            Picking.status,
            Picking.schedule_date < today,
            Picking.schedule_date > today,
        ).where(Picking.status.in_(OPEN))
    )
    for type_, status, late, upcoming in db.execute(open_pickings):
        card = cards[type_]
        card.pending += 1
        card.late += late
        card.upcoming += upcoming
        card.waiting += status == "waiting"
    return KpisOut(
        total_products_in_stock=sum(qty > 0 for qty in on_hand_totals(db).values()),
        low_stock=len(low),
        out_of_stock=len(out),
        pending_receipts=cards[PickingType.receipt].pending,
        pending_deliveries=cards[PickingType.delivery].pending,
        internal_transfers_scheduled=cards[PickingType.internal].pending,
        receipts=cards[PickingType.receipt],
        deliveries=cards[PickingType.delivery],
        internal=cards[PickingType.internal],
    )
