from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.deps import DB, CurrentUser, get_current_user
from app.models.product import Product
from app.models.reorder_rule import ReorderRule
from app.schemas.product import ProductCreate, ProductDetail, ProductIn, ProductOut
from app.services import stock_engine
from app.services.stock_query import (
    on_hand_totals,
    product_search,
    stock_alerts,
    stock_rows,
)

router = APIRouter(
    prefix="/products", tags=["products"], dependencies=[Depends(get_current_user)]
)


def _out(db: DB, products: list[Product]) -> list[dict]:
    totals = on_hand_totals(db)
    low, out = stock_alerts(db)
    return [
        {
            **ProductIn.model_validate(p, from_attributes=True).model_dump(),
            "id": p.id,
            "category_name": p.category.name if p.category else None,
            "on_hand": totals.get(p.id, 0),
            "low_stock": p.id in low,
            "out_of_stock": p.id in out,
        }
        for p in products
    ]


def _detail(db: DB, product_id: int) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Product not found")
    return {
        **_out(db, [product])[0],
        "stock": stock_rows(db, product_id=product_id),
        "reorder_rules": db.scalars(
            select(ReorderRule).where(ReorderRule.product_id == product_id)
        ).all(),
    }


@router.get("", response_model=list[ProductOut])
def list_products(db: DB, search: str | None = None, category_id: int | None = None):
    query = product_search(select(Product).order_by(Product.name), search)
    if category_id:
        query = query.where(Product.category_id == category_id)
    return _out(db, db.scalars(query).all())


@router.post("", response_model=ProductDetail, status_code=201)
def create_product(body: ProductCreate, db: DB, user: CurrentUser):
    product = Product(**body.model_dump(exclude={"initial_stock", "location_id"}))
    db.add(product)
    db.flush()
    if body.initial_stock:
        # Recorded as an adjustment so it shows in the move history.
        stock_engine.adjust(
            db, product.id, body.location_id, body.initial_stock, user.id
        )
    db.commit()
    return _detail(db, product.id)


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(product_id: int, db: DB):
    return _detail(db, product_id)


@router.put("/{product_id}", response_model=ProductDetail)
def update_product(product_id: int, body: ProductIn, db: DB):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Product not found")
    for key, value in body.model_dump().items():
        setattr(product, key, value)
    db.commit()
    return _detail(db, product_id)
