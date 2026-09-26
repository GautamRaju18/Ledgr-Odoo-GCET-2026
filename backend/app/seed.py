"""Demo data. Run once after migrating: python -m app.seed

Demo login: login_id `demo01`, password `Demo@1234`.
"""

from decimal import Decimal

from sqlalchemy import select

from app.database import SessionLocal
from app.models.category import Category
from app.models.location import Location, LocationType
from app.models.partner import Partner, PartnerType
from app.models.product import Product
from app.models.reorder_rule import ReorderRule
from app.models.user import User
from app.models.warehouse import Warehouse
from app.services.auth_service import hash_secret


def seed() -> None:
    with SessionLocal() as db:
        if db.scalars(select(Warehouse)).first():
            print("Already seeded")
            return

        virtual = [
            Location(name=name, type=kind)
            for name, kind in [
                ("Vendors", LocationType.vendor),
                ("Customers", LocationType.customer),
                ("Inventory Loss", LocationType.inventory_loss),
            ]
        ]
        wh = Warehouse(name="Main Warehouse", short_code="WH", address="Plot 12, GIDC")
        wh2 = Warehouse(name="Second Warehouse", short_code="WH2", address="Sector 5")
        db.add_all(
            [
                *virtual,
                Location(name="Stock", short_code="STOCK", warehouse=wh),
                Location(name="Production Rack", short_code="RACK", warehouse=wh),
                Location(name="Stock", short_code="STOCK", warehouse=wh2),
            ]
        )

        raw, furniture, hardware = (
            Category(name="Raw Materials"),
            Category(name="Furniture"),
            Category(name="Hardware"),
        )
        products = {
            sku: Product(
                name=name, sku=sku, category=cat, uom=uom, per_unit_cost=Decimal(cost)
            )
            for name, sku, cat, uom, cost in [
                ("Steel", "STEEL001", raw, "kg", "80"),
                ("Steel Rods", "ROD001", raw, "Units", "250"),
                ("Chairs", "CHAIR001", furniture, "Units", "1200"),
                ("Desk", "DESK001", furniture, "Units", "3000"),
                ("Office Table", "TABLE001", furniture, "Units", "4500"),
                ("Bolts", "BOLT001", hardware, "Units", "5"),
            ]
        }
        db.add_all(products.values())
        db.add_all(
            [
                Partner(name="Tata Steel Supplies", type=PartnerType.vendor),
                Partner(
                    name="Acme Offices", type=PartnerType.customer, address="MG Road"
                ),
            ]
        )
        db.flush()
        db.add_all(
            [
                ReorderRule(
                    product_id=products[sku].id,
                    warehouse_id=wh.id,
                    min_qty=Decimal(lo),
                    max_qty=Decimal(hi),
                )
                for sku, lo, hi in [
                    ("STEEL001", 100, 500),
                    ("CHAIR001", 10, 50),
                    ("DESK001", 5, 20),
                ]
            ]
        )
        db.add(
            User(
                login_id="demo01",
                name="Demo User",
                email="ledgr.stocksense@gmail.com",
                password_hash=hash_secret("Demo@1234"),
            )
        )
        db.commit()
        print("Seeded demo data")


if __name__ == "__main__":
    seed()
