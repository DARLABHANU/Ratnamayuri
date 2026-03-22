import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import (
    SignupRequest, LoginRequest, TokenResponse, OTPVerifyRequest,
    OTPResendRequest, RefreshRequest, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserBase,
)
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token,
)
from app.core.deps import get_current_user
from app.services.otp_service import create_and_send_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_account_number() -> str:
    prefix = "RM"
    digits = "".join(random.choices(string.digits, k=10))
    return f"{prefix}{digits}"


@router.post("/signup", status_code=201)
async def signup(
    payload: SignupRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Only allow certain roles to be created via public signup
    if payload.role in (UserRole.admin, UserRole.support):
        raise HTTPException(status_code=403, detail="Cannot self-register as admin/support")

    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    account_number = generate_account_number()
    # Ensure unique account number
    while True:
        res = await db.execute(select(User).where(User.account_number == account_number))
        if not res.scalar_one_or_none():
            break
        account_number = generate_account_number()

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
        account_number=account_number,
        is_first_login=True,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send OTP in background
    background_tasks.add_task(create_and_send_otp, db, user, "email_verification")

    return {
        "message": "Account created. Please verify your email with the OTP sent.",
        "email": user.email,
        "requires_otp": True,
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == payload.email, User.role == payload.role)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact support.")

    # If first login, require OTP verification
    if user.is_first_login and not user.is_verified:
        # Resend OTP
        await create_and_send_otp(db, user, "email_verification")
        return TokenResponse(
            access_token="",
            refresh_token="",
            role=user.role,
            user_id=user.id,
            is_first_login=True,
            requires_otp=True,
        )

    token_data = {"sub": str(user.id), "role": user.role.value, "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        is_first_login=False,
        requires_otp=False,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(payload: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid = await verify_otp(db, user, payload.otp, payload.purpose)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Mark verified
    user.is_verified = True
    user.is_first_login = False
    await db.commit()
    await db.refresh(user)

    token_data = {"sub": str(user.id), "role": user.role.value, "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        is_first_login=False,
        requires_otp=False,
    )


@router.post("/resend-otp")
async def resend_otp(
    payload: OTPResendRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    background_tasks.add_task(create_and_send_otp, db, user, payload.purpose)
    return {"message": "OTP resent successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = decoded.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    token_data = {"sub": str(user.id), "role": user.role.value, "email": user.email}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role=user.role,
        user_id=user.id,
    )


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    # Always return success to prevent email enumeration
    if user:
        background_tasks.add_task(create_and_send_otp, db, user, "password_reset")
    return {"message": "If the email exists, an OTP has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid = await verify_otp(db, user, payload.otp, "password_reset")
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserBase)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
