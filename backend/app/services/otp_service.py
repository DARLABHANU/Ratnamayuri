import random
import string
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.models import OTPCode, User
from app.core.config import settings
from app.services.email_service import send_otp_email


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def create_and_send_otp(
    db: AsyncSession, user: User, purpose: str = "email_verification"
) -> bool:
    """Invalidate previous OTPs, create new one, send email."""
    # Invalidate old OTPs for this user/purpose
    await db.execute(
        update(OTPCode)
        .where(OTPCode.user_id == user.id, OTPCode.purpose == purpose, OTPCode.is_used == False)
        .values(is_used=True)
    )

    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp = OTPCode(
        user_id=user.id,
        code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(otp)
    await db.commit()

    # Send email
    sent = await send_otp_email(user.email, user.full_name, otp_code, purpose)
    return sent


async def verify_otp(
    db: AsyncSession, user: User, code: str, purpose: str = "email_verification"
) -> bool:
    """Verify OTP code. Returns True if valid."""
    result = await db.execute(
        select(OTPCode).where(
            OTPCode.user_id == user.id,
            OTPCode.code == code,
            OTPCode.purpose == purpose,
            OTPCode.is_used == False,
        )
    )
    otp = result.scalar_one_or_none()

    if not otp:
        return False

    if datetime.utcnow() > otp.expires_at:
        return False

    # Mark as used
    otp.is_used = True
    await db.commit()
    return True
