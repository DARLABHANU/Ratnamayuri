from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.session import get_db
from app.models.models import User, AuditLog, AuditAction, Order, UserRole
from app.schemas.schemas import (
    SupportLookupRequest, ImpersonateRequest, ImpersonateResponse,
    UserBase, OrderListResponse,
)
from app.core.deps import require_admin_or_support, require_support, get_client_ip, get_current_user
from app.core.security import create_impersonation_token
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/support", tags=["Support"])


@router.post("/lookup", response_model=list[UserBase])
async def lookup_user(
    payload: SupportLookupRequest,
    request: Request,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    """Look up customer by account number, email, or name."""
    if not any([payload.account_number, payload.email, payload.name]):
        raise HTTPException(status_code=400, detail="Provide at least one search criterion")

    conditions = []
    if payload.account_number:
        conditions.append(User.account_number == payload.account_number.upper())
    if payload.email:
        conditions.append(User.email.ilike(f"%{payload.email}%"))
    if payload.name:
        conditions.append(User.full_name.ilike(f"%{payload.name}%"))

    result = await db.execute(
        select(User).where(or_(*conditions)).limit(20)
    )
    users = result.scalars().all()

    # Log the lookup
    audit = AuditLog(
        performed_by=current_user.id,
        action=AuditAction.view_account,
        description=f"Support lookup: {payload.model_dump()}",
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        metadata={"query": payload.model_dump(), "results_count": len(users)},
    )
    db.add(audit)
    await db.commit()

    return users


@router.post("/impersonate", response_model=ImpersonateResponse)
async def impersonate_user(
    payload: ImpersonateRequest,
    request: Request,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    """Generate a temporary impersonation token to act on behalf of a user."""
    target_res = await db.execute(select(User).where(User.id == payload.target_user_id))
    target_user = target_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Support cannot impersonate admin/support
    if target_user.role in (UserRole.admin, UserRole.support):
        raise HTTPException(status_code=403, detail="Cannot impersonate admin or support users")

    # Create audit log first
    audit = AuditLog(
        performed_by=current_user.id,
        target_user_id=target_user.id,
        action=AuditAction.impersonation_start,
        description=f"Impersonation started. Reason: {payload.reason}",
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        metadata={
            "reason": payload.reason,
            "target_email": target_user.email,
            "target_role": target_user.role.value,
        },
    )
    db.add(audit)
    await db.commit()
    await db.refresh(audit)

    token = create_impersonation_token(
        support_user_id=current_user.id,
        target_user_id=target_user.id,
        audit_log_id=audit.id,
    )

    return ImpersonateResponse(
        impersonation_token=token,
        target_user=target_user,
        audit_log_id=audit.id,
        expires_in_seconds=7200,
    )


@router.post("/impersonate/end/{audit_log_id}")
async def end_impersonation(
    audit_log_id: int,
    request: Request,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    """Log the end of an impersonation session."""
    audit = AuditLog(
        performed_by=current_user.id,
        action=AuditAction.impersonation_end,
        description=f"Impersonation session ended (started at audit_log_id={audit_log_id})",
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        metadata={"original_audit_log_id": audit_log_id},
    )
    db.add(audit)
    await db.commit()
    return {"message": "Impersonation session ended and logged"}


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func
    total = (await db.execute(select(func.count(AuditLog.id)))).scalar()
    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    logs = result.scalars().all()
    return {"items": logs, "total": total, "page": page, "page_size": page_size}


@router.get("/user/{user_id}/orders", response_model=OrderListResponse)
async def view_user_orders(
    user_id: int,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    """Support can view any user's orders."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.customer_id == user_id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return OrderListResponse(
        items=orders,
        total=len(orders),
        page=1,
        page_size=len(orders),
        pages=1,
    )


@router.patch("/user/{user_id}/reset-password")
async def support_reset_password(
    user_id: int,
    payload: dict,
    request: Request,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    """Support can reset a user's password (with audit log)."""
    from app.core.security import hash_password
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_password = payload.get("new_password")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")

    user.hashed_password = hash_password(new_password)

    audit = AuditLog(
        performed_by=current_user.id,
        target_user_id=user.id,
        action=AuditAction.reset_password,
        description="Support agent reset user password",
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
    )
    db.add(audit)
    await db.commit()
    return {"message": "Password reset successfully"}
