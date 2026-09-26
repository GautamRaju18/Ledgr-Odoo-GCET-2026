from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import DB, CurrentUser, get_current_user
from app.schemas.product import StockRow
from app.services import stock_engine
from app.services.stock_query import stock_rows

router = APIRouter(
    prefix="/stock", tags=["stock"], dependencies=[Depends(get_current_user)]
)


class AdjustIn(BaseModel):
    product_id: int
    location_id: int
    counted_quantity: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class AdjustOut(BaseModel):
    reference: str | None  # None when the count matched, so nothing changed


@router.get("", response_model=list[StockRow])
def list_stock(
    db: DB,
    search: str | None = None,
    warehouse_id: int | None = None,
    location_id: int | None = None,
    category_id: int | None = None,
):
    return stock_rows(db, search, warehouse_id, location_id, category_id)


@router.post("/adjust", response_model=AdjustOut)
def adjust_stock(body: AdjustIn, db: DB, user: CurrentUser):
    picking = stock_engine.adjust(
        db, body.product_id, body.location_id, body.counted_quantity, user.id
    )
    db.commit()
    return AdjustOut(reference=picking.reference if picking else None)
