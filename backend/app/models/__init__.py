# Import every model so Base.metadata (Alembic, relationships) sees all tables.
from app.models import (  # noqa: F401
    category,
    location,
    move,
    otp,
    partner,
    picking,
    product,
    quant,
    reorder_rule,
    sequence,
    user,
    warehouse,
)
