from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.location import LocationType
from app.models.partner import PartnerType

Name = Field(min_length=1, max_length=100)
Qty = Field(ge=0, max_digits=12, decimal_places=2)


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int


class WarehouseIn(BaseModel):
    name: str = Name
    short_code: str = Field(min_length=1, max_length=10, pattern=r"^[A-Za-z0-9]+$")
    address: str | None = None


class WarehouseOut(WarehouseIn, Out):
    pass


class LocationIn(BaseModel):
    name: str = Name
    short_code: str | None = None
    warehouse_id: int | None = None
    type: LocationType = LocationType.internal

    @model_validator(mode="after")
    def internal_needs_warehouse(self):
        if self.type == LocationType.internal and self.warehouse_id is None:
            raise ValueError("A warehouse location needs a warehouse")
        return self


class LocationOut(LocationIn, Out):
    full_name: str


class CategoryIn(BaseModel):
    name: str = Name


class CategoryOut(CategoryIn, Out):
    pass


class PartnerIn(BaseModel):
    name: str = Name
    type: PartnerType
    address: str | None = None


class PartnerOut(PartnerIn, Out):
    pass


class ReorderRuleIn(BaseModel):
    product_id: int
    warehouse_id: int
    min_qty: Decimal = Qty
    max_qty: Decimal = Qty

    @model_validator(mode="after")
    def min_not_above_max(self):
        if self.min_qty > self.max_qty:
            raise ValueError("Min quantity cannot exceed max quantity")
        return self


class ReorderRuleOut(ReorderRuleIn, Out):
    pass
