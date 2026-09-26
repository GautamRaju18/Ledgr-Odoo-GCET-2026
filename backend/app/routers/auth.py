from fastapi import APIRouter, HTTPException
from sqlalchemy import or_, select

from app.deps import DB
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordIn,
    LoginIn,
    ResetPasswordIn,
    SignupIn,
    TokenOut,
    UserOut,
)
from app.services import otp_service
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


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordIn, db: DB):
    otp_service.request_otp(db, body.email)
    return {"detail": "If that email is registered, an OTP has been sent"}


@router.post("/reset-password")
def reset_password(body: ResetPasswordIn, db: DB):
    otp_service.reset_password(db, body.email, body.otp, body.new_password)
    return {"detail": "Password updated, please log in"}


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: DB):
    user = db.scalars(select(User).where(User.login_id == body.login_id)).first()
    if user is None or not verify_secret(body.password, user.password_hash):
        raise HTTPException(401, "Invalid Login ID or Password")
    return _token(user)
