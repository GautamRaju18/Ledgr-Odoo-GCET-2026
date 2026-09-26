"""List/create/read/update/delete for the simple master-data tables."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.database import Base
from app.deps import DB, get_current_user
from app.models.category import Category
from app.models.location import Location
from app.models.partner import Partner
from app.models.reorder_rule import ReorderRule
from app.models.warehouse import Warehouse
from app.schemas import master_data as s


def crud_router(
    prefix: str, model: type[Base], In: type[BaseModel], Out: type[BaseModel]
) -> APIRouter:
    router = APIRouter(
        prefix=prefix, tags=[prefix[1:]], dependencies=[Depends(get_current_user)]
    )

    def get_or_404(db, item_id: int):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(404, "Not found")
        return item

    @router.get("", response_model=list[Out])
    def list_items(db: DB):
        return db.scalars(select(model).order_by(model.id)).all()

    @router.get("/{item_id}", response_model=Out)
    def get_item(item_id: int, db: DB):
        return get_or_404(db, item_id)

    @router.post("", response_model=Out, status_code=201)
    def create_item(body: In, db: DB):
        item = model(**body.model_dump())
        db.add(item)
        db.commit()
        return item

    @router.put("/{item_id}", response_model=Out)
    def update_item(item_id: int, body: In, db: DB):
        item = get_or_404(db, item_id)
        for key, value in body.model_dump().items():
            setattr(item, key, value)
        db.commit()
        return item

    @router.delete("/{item_id}", status_code=204)
    def delete_item(item_id: int, db: DB):
        db.delete(get_or_404(db, item_id))
        db.commit()

    return router


routers = [
    crud_router("/warehouses", Warehouse, s.WarehouseIn, s.WarehouseOut),
    crud_router("/locations", Location, s.LocationIn, s.LocationOut),
    crud_router("/categories", Category, s.CategoryIn, s.CategoryOut),
    crud_router("/partners", Partner, s.PartnerIn, s.PartnerOut),
    crud_router("/reorder-rules", ReorderRule, s.ReorderRuleIn, s.ReorderRuleOut),
]
