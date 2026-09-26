from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import decode_token


def get_db() -> Iterator[Session]:
    # Closing without commit rolls back anything a failed request left behind.
    with SessionLocal() as db:
        yield db


bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if creds is None:
        raise HTTPException(401, "Not logged in")
    user = db.get(User, decode_token(creds.credentials))
    if user is None:
        raise HTTPException(401, "Session expired, please log in again")
    return user


DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
