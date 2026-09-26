from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import HTTPException

from app.config import settings


def hash_secret(secret: str) -> str:
    return bcrypt.hashpw(secret.encode(), bcrypt.gensalt()).decode()


def verify_secret(secret: str, hashed: str) -> bool:
    return bcrypt.checkpw(secret.encode(), hashed.encode())


def create_token(user_id: int) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires}, settings.jwt_secret, "HS256"
    )


def decode_token(token: str) -> int:
    try:
        return int(jwt.decode(token, settings.jwt_secret, ["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Session expired, please log in again") from None
