import logging
import secrets
import smtplib
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.otp import PasswordResetOtp
from app.models.user import User
from app.services.auth_service import hash_secret, verify_secret

OTP_TTL = timedelta(minutes=10)
MAX_ATTEMPTS = 5
log = logging.getLogger("uvicorn.error")


def _send(email: str, code: str) -> None:
    if settings.smtp_user:
        msg = EmailMessage()
        msg["Subject"] = "StockSense password reset code"
        msg["From"] = settings.smtp_user
        msg["To"] = email
        msg.set_content(f"Your StockSense OTP is {code}. It expires in 10 minutes.")
        try:
            with smtplib.SMTP(
                settings.smtp_host, settings.smtp_port, timeout=10
            ) as smtp:
                smtp.starttls()
                smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(msg)
            return
        except (smtplib.SMTPException, OSError):
            log.exception("Could not email the OTP; printing it instead")
    log.warning("Password reset OTP for %s: %s", email, code)


def request_otp(db: Session, email: str) -> None:
    """Send an OTP if the email is registered; silent otherwise (no account probing)."""
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None:
        return
    code = f"{secrets.randbelow(10**6):06d}"
    db.add(
        PasswordResetOtp(
            user_id=user.id,
            otp_hash=hash_secret(code),
            expires_at=datetime.now(UTC) + OTP_TTL,
        )
    )
    db.commit()
    _send(email, code)


def reset_password(db: Session, email: str, code: str, new_password: str) -> None:
    otp = db.scalars(
        select(PasswordResetOtp)
        .join(User)
        .where(
            User.email == email,
            PasswordResetOtp.used.is_(False),
            PasswordResetOtp.expires_at > datetime.now(UTC),
        )
        .order_by(PasswordResetOtp.id.desc())
        .with_for_update(of=PasswordResetOtp)
    ).first()
    if otp is None:
        raise HTTPException(400, "OTP expired or not requested; request a new one")
    if not verify_secret(code, otp.otp_hash):
        otp.attempts += 1
        otp.used = otp.attempts >= MAX_ATTEMPTS  # stop brute force
        db.commit()
        raise HTTPException(400, "Incorrect OTP")
    otp.used = True
    db.get(User, otp.user_id).password_hash = hash_secret(new_password)
    db.commit()
