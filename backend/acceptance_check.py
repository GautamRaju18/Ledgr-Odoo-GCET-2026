"""Acceptance scenario steps 1-8 through the API.

Run on a fresh database from backend/:
    alembic downgrade base && alembic upgrade head && python -m app.seed
    python acceptance_check.py
"""

import logging
import re

from fastapi.testclient import TestClient

from app.main import app

codes = []


class H(logging.Handler):
    def emit(self, r):
        codes.append(r.getMessage())


logging.getLogger("uvicorn.error").addHandler(H())
c = TestClient(app)


def ok(r, code=200):
    assert r.status_code == code, (r.status_code, r.text)
    return r.json()


# 1. signup, reset password with OTP, login
ok(
    c.post(
        "/api/auth/signup",
        json={
            "login_id": "gautam1",
            "name": "Gautam",
            "email": "g@example.com",
            "password": "Pass@1234",
        },
    ),
    201,
)
ok(c.post("/api/auth/forgot-password", json={"email": "g@example.com"}))
otp = re.search(r"(\d{6})$", codes[-1]).group(1)
ok(
    c.post(
        "/api/auth/reset-password",
        json={"email": "g@example.com", "otp": otp, "new_password": "Reset@1234"},
    )
)
c.headers["Authorization"] = (
    "Bearer "
    + ok(
        c.post(
            "/api/auth/login", json={"login_id": "gautam1", "password": "Reset@1234"}
        )
    )["access_token"]
)

loc = {l["full_name"]: l["id"] for l in ok(c.get("/api/locations"))}
steel = next(p["id"] for p in ok(c.get("/api/products?search=STEEL001")))


def op(type_, actions, qty, **kw):
    p = ok(
        c.post(
            "/api/pickings",
            json={
                "type": type_,
                "lines": [{"product_id": steel, "quantity": qty}],
                **kw,
            },
        ),
        201,
    )
    for a in actions:
        p = ok(c.post(f"/api/pickings/{p['id']}/{a}"))
    return p


def on_hand():
    return {
        r["location_name"]: float(r["on_hand"])
        for r in ok(c.get("/api/stock?search=STEEL001"))
    }


# 2-5
p = op(
    "receipt", ["todo", "validate"], 100, dest_location_id=loc["WH/Stock"], partner_id=1
)
assert p["reference"] == "WH/IN/0001" and on_hand() == {"WH/Stock": 100}
p = op(
    "internal",
    ["todo", "validate"],
    100,
    source_location_id=loc["WH/Stock"],
    dest_location_id=loc["WH/Production Rack"],
)
assert p["reference"] == "WH/INT/0001" and on_hand() == {
    "WH/Stock": 0,
    "WH/Production Rack": 100,
}
p = op(
    "delivery", ["todo"], 20, source_location_id=loc["WH/Production Rack"], partner_id=2
)
assert p["status"] == "ready" and p["lines"][0]["available"] is True
p = ok(c.post(f"/api/pickings/{p['id']}/validate"))
assert p["reference"] == "WH/OUT/0001" and on_hand()["WH/Production Rack"] == 80
assert (
    ok(
        c.post(
            "/api/stock/adjust",
            json={
                "product_id": steel,
                "location_id": loc["WH/Production Rack"],
                "counted_quantity": 77,
            },
        )
    )["reference"]
    == "WH/ADJ/0001"
)
assert on_hand()["WH/Production Rack"] == 77
# 6
p = op("delivery", ["todo"], 500, source_location_id=loc["WH/Production Rack"])
assert p["status"] == "waiting" and p["lines"][0]["available"] is False
# 7 move history: planned (open) lines first, then the done ledger
moves = ok(c.get("/api/moves"))
assert [(m["reference"], m["direction"], m["status"]) for m in moves[:2]] == [
    ("WH/OUT/0002", "out", "waiting"),
    ("WH/ADJ/0001", "out", "done"),
], moves
moves = [m for m in moves if m["status"] == "done"]
assert [(m["reference"], m["direction"]) for m in moves] == [
    ("WH/ADJ/0001", "out"),
    ("WH/OUT/0001", "out"),
    ("WH/INT/0001", "internal"),
    ("WH/IN/0001", "in"),
], moves
assert [m["reference"] for m in ok(c.get("/api/moves?search=WH/IN/"))] == ["WH/IN/0001"]
assert (
    moves[3]["from_location"] == "Vendors"
    and moves[3]["partner_name"] == "Tata Steel Supplies"
)
# filters on operations
assert len(ok(c.get("/api/pickings?type=delivery"))) == 2
assert len(ok(c.get("/api/pickings?status=waiting"))) == 1
assert len(ok(c.get("/api/pickings?search=acme"))) == 1
assert len(ok(c.get("/api/pickings?warehouse_id=2"))) == 0
assert len(ok(c.get("/api/pickings?category_id=2"))) == 0
assert len(ok(c.get(f"/api/pickings?location_id={loc['WH/Production Rack']}"))) == 4
# 8 dashboard
k = ok(c.get("/api/dashboard/kpis"))
assert (
    k["pending_deliveries"] == 1
    and k["deliveries"]["waiting"] == 1
    and k["pending_receipts"] == 0
), k
assert (
    k["total_products_in_stock"] == 1 and k["low_stock"] == 1 and k["out_of_stock"] == 5
), k
assert ok(c.get("/api/products?search=STEEL001"))[0]["low_stock"] is True
assert ok(c.get("/api/dashboard/kpis?warehouse_id=2"))["pending_deliveries"] == 0
print("OK: backend acceptance steps 1-8 pass")
