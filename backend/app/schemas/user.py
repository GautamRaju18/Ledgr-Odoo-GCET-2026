import re
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field


def check_password(value: str) -> str:
    if not (
        re.search(r"[a-z]", value)
        and re.search(r"[A-Z]", value)
        and re.search(r"[^A-Za-z0-9]", value)
    ):
        raise ValueError(
            "Password needs a lowercase letter, an uppercase letter "
            "and a special character"
        )
    return value


# bcrypt only hashes the first 72 bytes, so cap the length.
Password = Annotated[
    str, Field(min_length=8, max_length=72), AfterValidator(check_password)
]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login_id: str
    name: str
    email: str


class SignupIn(BaseModel):
    login_id: str = Field(min_length=6, max_length=12, pattern=r"^\S+$")
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: Password


class LoginIn(BaseModel):
    login_id: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    email: EmailStr
    otp: str = Field(pattern=r"^\d{6}$")
    new_password: Password


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
