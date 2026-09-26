from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.picking import PickingType
from app.models.sequence import PickingSequence

PREFIX = {
    PickingType.receipt: "IN",
    PickingType.delivery: "OUT",
    PickingType.internal: "INT",
    PickingType.adjustment: "ADJ",
}


def next_reference(db: Session, warehouse, picking_type: PickingType) -> str:
    """Return the next reference, e.g. WH/IN/0001.

    One upsert: row-locked by Postgres, so concurrent callers never get the same
    number, and it rolls back with the caller's transaction.
    """
    stmt = (
        insert(PickingSequence)
        .values(
            warehouse_id=warehouse.id, picking_type=picking_type.value, next_number=2
        )
        .on_conflict_do_update(
            index_elements=["warehouse_id", "picking_type"],
            set_={"next_number": PickingSequence.next_number + 1},
        )
        .returning(PickingSequence.next_number - 1)
    )
    number = db.execute(stmt).scalar_one()
    return f"{warehouse.short_code}/{PREFIX[picking_type]}/{number:04d}"
