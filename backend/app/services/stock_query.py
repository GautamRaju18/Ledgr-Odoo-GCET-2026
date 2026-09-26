"""Read-only stock figures shared by products, stock and dashboard."""

from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.product import Product
from app.models.quant import StockQuant
from app.models.reorder_rule import ReorderRule
from app.services.stock_engine import reserved


def on_hand_totals(db: Session) -> dict[int, Decimal]:
    """product_id -> on hand across all internal locations (only they hold quants)."""
    return dict(
        db.execute(
            select(StockQuant.product_id, func.sum(StockQuant.quantity)).group_by(
                StockQuant.product_id
            )
        ).all()
    )


def stock_alerts(db: Session) -> tuple[set[int], set[int]]:
    """(low, out) product ids.

    Out of stock: nothing on hand anywhere. Low stock: on hand in a warehouse is at or
    below that warehouse's reorder minimum (and not already out of stock).
    """
    totals = on_hand_totals(db)
    out = {pid for pid in db.scalars(select(Product.id)) if not totals.get(pid)}
    per_warehouse = {
        (product, warehouse): qty
        for product, warehouse, qty in db.execute(
            select(
                StockQuant.product_id,
                Location.warehouse_id,
                func.sum(StockQuant.quantity),
            )
            .join(Location)
            .group_by(StockQuant.product_id, Location.warehouse_id)
        )
    }
    low = {
        rule.product_id
        for rule in db.scalars(select(ReorderRule))
        if per_warehouse.get((rule.product_id, rule.warehouse_id), 0) <= rule.min_qty
    }
    return low - out, out


def product_search(query, search: str | None):
    """Case-insensitive match on SKU or name."""
    if not search:
        return query
    pattern = f"%{search}%"
    return query.where(or_(Product.sku.ilike(pattern), Product.name.ilike(pattern)))


def stock_rows(
    db: Session,
    search: str | None = None,
    warehouse_id: int | None = None,
    location_id: int | None = None,
    category_id: int | None = None,
    product_id: int | None = None,
) -> list[dict]:
    """One row per product per location that has (or had) stock."""
    query = (
        select(StockQuant, Product, Location)
        .join(Product, Product.id == StockQuant.product_id)
        .join(Location, Location.id == StockQuant.location_id)
        .order_by(Product.name, Location.id)
    )
    query = product_search(query, search)
    for column, value in [
        (Location.warehouse_id, warehouse_id),
        (Location.id, location_id),
        (Product.category_id, category_id),
        (Product.id, product_id),
    ]:
        if value:
            query = query.where(column == value)

    held = reserved(db)
    low, out = stock_alerts(db)
    return [
        {
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "uom": product.uom,
            "category_id": product.category_id,
            "per_unit_cost": product.per_unit_cost,
            "location_id": location.id,
            "location_name": location.full_name,
            "warehouse_id": location.warehouse_id,
            "on_hand": quant.quantity,
            "free_to_use": quant.quantity - held.get((product.id, location.id), 0),
            "low_stock": product.id in low,
            "out_of_stock": product.id in out,
        }
        for quant, product, location in db.execute(query)
    ]
