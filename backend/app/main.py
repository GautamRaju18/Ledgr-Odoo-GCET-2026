from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.routers import (
    auth,
    dashboard,
    master_data,
    moves,
    pickings,
    products,
    stock,
    users,
)

app = FastAPI(title="StockSense")


@app.exception_handler(IntegrityError)
def integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    # e.g. 'Key (sku)=(DESK001) already exists.'
    detail = getattr(getattr(exc.orig, "diag", None), "message_detail", None)
    return JSONResponse(
        status_code=409, content={"detail": detail or "Conflicts with existing data"}
    )


ROUTERS = (auth, users, pickings, moves, products, stock, dashboard)
for router in (*(m.router for m in ROUTERS), *master_data.routers):
    app.include_router(router, prefix="/api")
