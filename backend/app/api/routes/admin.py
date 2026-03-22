from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import (
    User, Order, Product, Coupon, Commission, MerchantProfile,
    UserRole, OrderStatus, CommissionStatus
)
from app.schemas.schemas import (
    AdminUserUpdate, MerchantApproval, CouponCreate, CouponResponse,
    UserBase, OrderResponse, OrderListResponse, CommissionResponse,
    AdminDashboard, MerchantProfileResponse,
)
from app.core.deps import require_admin, require_admin_or_support

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=AdminDashboard)
async def admin_dashboard(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.customer))).scalar()
    total_merchants = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.merchant))).scalar()
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar()
    total_revenue = (await db.execute(select(func.sum(Order.total_amount)).where(Order.status == OrderStatus.delivered))).scalar() or 0
    pending_orders = (await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.pending))).scalar()
    active_coupons = (await db.execute(select(func.count(Coupon.id)).where(Coupon.is_active == True))).scalar()

    recent_orders_res = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    recent_orders = recent_orders_res.scalars().all()

    return AdminDashboard(
        total_users=total_users,
        total_merchants=total_merchants,
        total_orders=total_orders,
        total_revenue=total_revenue,
        pending_orders=pending_orders,
        active_coupons=active_coupons,
        recent_orders=recent_orders,
    )


# ─── User Management ──────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    where = []
    if role:
        where.append(User.role == role)
    if search:
        from sqlalchemy import or_
        where.append(or_(
            User.email.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%"),
            User.account_number.ilike(f"%{search}%"),
        ))

    total = (await db.execute(select(func.count(User.id)).where(*where))).scalar()
    result = await db.execute(
        select(User).where(*where).order_by(User.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    users = result.scalars().all()
    return {"items": users, "total": total, "page": page, "page_size": page_size}


@router.get("/users/{user_id}", response_model=UserBase)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserBase)
async def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(user, key, val)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/users", response_model=UserBase, status_code=201)
async def create_internal_user(
    payload: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create admin/support user."""
    from app.core.security import hash_password
    import random, string

    role = UserRole(payload.get("role", "support"))
    if role not in (UserRole.admin, UserRole.support):
        raise HTTPException(status_code=400, detail="Can only create admin/support via this endpoint")

    existing = await db.execute(select(User).where(User.email == payload["email"]))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already exists")

    account_number = "RM" + "".join(random.choices(string.digits, k=10))
    user = User(
        email=payload["email"],
        hashed_password=hash_password(payload["password"]),
        full_name=payload["full_name"],
        role=role,
        account_number=account_number,
        is_verified=True,
        is_first_login=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ─── Merchant Management ──────────────────────────────────────────────────────

@router.get("/merchants")
async def list_merchants(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_approved: Optional[bool] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    where = []
    if is_approved is not None:
        where.append(MerchantProfile.is_approved == is_approved)

    total = (await db.execute(select(func.count(MerchantProfile.id)).where(*where))).scalar()
    result = await db.execute(
        select(MerchantProfile)
        .options(selectinload(MerchantProfile.user))
        .where(*where)
        .offset((page - 1) * page_size).limit(page_size)
    )
    merchants = result.scalars().all()
    return {"items": merchants, "total": total, "page": page, "page_size": page_size}


@router.patch("/merchants/{merchant_id}/approval", response_model=MerchantProfileResponse)
async def approve_merchant(
    merchant_id: int,
    payload: MerchantApproval,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MerchantProfile).where(MerchantProfile.id == merchant_id))
    merchant = result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant.is_approved = payload.is_approved
    if payload.commission_rate is not None:
        merchant.commission_rate = payload.commission_rate
    await db.commit()
    await db.refresh(merchant)
    return merchant


# ─── Order Management ─────────────────────────────────────────────────────────

@router.get("/orders", response_model=OrderListResponse)
async def admin_list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    current_user: User = Depends(require_admin_or_support),
    db: AsyncSession = Depends(get_db),
):
    where = []
    if status:
        where.append(Order.status == status)

    total = (await db.execute(select(func.count(Order.id)).where(*where))).scalar()
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(*where)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    orders = result.scalars().all()
    return OrderListResponse(
        items=orders,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


# ─── Coupon Management ────────────────────────────────────────────────────────

@router.get("/coupons", response_model=list[CouponResponse])
async def list_coupons(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    return result.scalars().all()


@router.post("/coupons", response_model=CouponResponse, status_code=201)
async def create_coupon(
    payload: CouponCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Coupon).where(Coupon.code == payload.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Coupon code already exists")

    coupon = Coupon(
        **payload.model_dump(),
        code=payload.code.upper(),
        created_by=current_user.id,
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon


@router.patch("/coupons/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: int,
    payload: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    for key, val in payload.items():
        if hasattr(coupon, key):
            setattr(coupon, key, val)
    await db.commit()
    await db.refresh(coupon)
    return coupon


@router.delete("/coupons/{coupon_id}", status_code=204)
async def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon.is_active = False
    await db.commit()


# ─── Commissions ──────────────────────────────────────────────────────────────

@router.get("/commissions", response_model=list[CommissionResponse])
async def list_commissions(
    status: Optional[CommissionStatus] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    where = []
    if status:
        where.append(Commission.status == status)
    result = await db.execute(
        select(Commission).where(*where).order_by(Commission.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/commissions/{commission_id}/pay", response_model=CommissionResponse)
async def pay_commission(
    commission_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Commission).where(Commission.id == commission_id))
    commission = result.scalar_one_or_none()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    commission.status = CommissionStatus.paid
    commission.paid_at = datetime.utcnow()
    await db.commit()
    await db.refresh(commission)
    return commission


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics/sales")
async def sales_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)

    total_revenue = (
        await db.execute(
            select(func.sum(Order.total_amount))
            .where(Order.created_at >= since, Order.status != OrderStatus.cancelled)
        )
    ).scalar() or 0

    total_orders = (
        await db.execute(select(func.count(Order.id)).where(Order.created_at >= since))
    ).scalar()

    avg_order = total_revenue / total_orders if total_orders else 0

    # Orders by status
    status_counts = {}
    for s in OrderStatus:
        count = (
            await db.execute(
                select(func.count(Order.id)).where(Order.created_at >= since, Order.status == s)
            )
        ).scalar()
        status_counts[s.value] = count

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "avg_order_value": round(avg_order, 2),
        "orders_by_status": status_counts,
        "period_days": days,
    }
