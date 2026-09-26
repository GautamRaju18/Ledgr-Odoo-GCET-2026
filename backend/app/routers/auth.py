from fastapi import APIRouter, HTTPException
from sqlalchemy import or_, select

from app.deps import DB
from app.models.user import User
from app.schemas.user import LoginIn, SignupIn, TokenOut, UserOut
from app.services.auth_service import create_token, hash_secret, verify_secret

router = APIRouter(prefix="/auth", tags=["auth"])


def _token(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_token(user.id), user=UserOut.model_validate(user)
    )


@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(body: SignupIn, db: DB):
    taken = db.scalars(
        select(User).where(
            or_(User.login_id == body.login_id, User.email == body.email)
        )
    ).first()
    if taken:
        field = "Login ID" if taken.login_id == body.login_id else "Email"
        raise HTTPException(409, f"{field} is already registered")
    user = User(
        login_id=body.login_id,
        name=body.name,
        email=body.email,
        password_hash=hash_secret(body.password),
    )
    db.add(user)
    db.commit()
    return _token(user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: DB):
    user = db.scalars(select(User).where(User.login_id == body.login_id)).first()
    if user is None or not verify_secret(body.password, user.password_hash):
        raise HTTPException(401, "Invalid Login ID or Password")
    return _token(user)
