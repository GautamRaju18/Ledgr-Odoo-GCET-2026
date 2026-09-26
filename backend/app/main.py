from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.routers import auth, master_data, pickings, products

app = FastAPI(title="StockSense")


@app.exception_handler(IntegrityError)
def integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    # e.g. 'Key (sku)=(DESK001) already exists.'
    detail = getattr(getattr(exc.orig, "diag", None), "message_detail", None)
    return JSONResponse(
        status_code=409, content={"detail": detail or "Conflicts with existing data"}
    )


for router in (auth.router, pickings.router, products.router, *master_data.routers):
    app.include_router(router, prefix="/api")
