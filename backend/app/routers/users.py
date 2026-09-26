from fastapi import APIRouter

from app.deps import DB, CurrentUser
from app.schemas.user import ProfileIn, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: CurrentUser):
    return user


@router.put("/me", response_model=UserOut)
def update_me(body: ProfileIn, db: DB, user: CurrentUser):
    user.name, user.email = body.name, body.email
    db.commit()
    return user
