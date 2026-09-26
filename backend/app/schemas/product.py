from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.schemas.master_data import ReorderRuleOut


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    sku: str = Field(min_length=1, max_length=32, pattern=r"^\S+$")
    category_id: int | None = None
    uom: str = Field(default="Units", min_length=1, max_length=20)
    per_unit_cost: Decimal = Field(
        default=Decimal(0), ge=0, max_digits=12, decimal_places=2
    )


class ProductCreate(ProductIn):
    initial_stock: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    location_id: int | None = None

    @model_validator(mode="after")
    def stock_needs_location(self):
        if self.initial_stock and not self.location_id:
            raise ValueError("Choose a location for the initial stock")
        return self


class ProductOut(ProductIn):
    id: int
    category_name: str | None
    on_hand: Decimal
    low_stock: bool
    out_of_stock: bool


class StockRow(BaseModel):
    product_id: int
    product_name: str
    sku: str
    uom: str
    category_id: int | None
    per_unit_cost: Decimal
    location_id: int
    location_name: str
    warehouse_id: int | None
    on_hand: Decimal
    free_to_use: Decimal
    low_stock: bool
    out_of_stock: bool


class ProductDetail(ProductOut):
    stock: list[StockRow]
    reorder_rules: list[ReorderRuleOut]
