from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import (
    User, MerchantProfile, Product, Order, OrderItem, Commission, OrderStatus
)
from app.schemas.schemas import (
    MerchantProfileCreate, MerchantProfileResponse, SalesAnalytics
)
from app.core.deps import require_merchant_or_admin, get_current_user

router = APIRouter(prefix="/merchant", tags=["Merchant"])


@router.post("/profile", response_model=MerchantProfileResponse, status_code=201)
async def create_merchant_profile(
    payload: MerchantProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role.value != "merchant":
        raise HTTPException(status_code=403, detail="Only merchants can create profiles")

    existing = await db.execute(
        select(MerchantProfile).where(MerchantProfile.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Merchant profile already exists")

    profile = MerchantProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/profile", response_model=MerchantProfileResponse)
async def get_merchant_profile(
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MerchantProfile).where(MerchantProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Merchant profile not found")
    return profile


@router.put("/profile", response_model=MerchantProfileResponse)
async def update_merchant_profile(
    payload: MerchantProfileCreate,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MerchantProfile).where(MerchantProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Merchant profile not found")

    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, val)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/analytics")
async def merchant_analytics(
    days: int = 30,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    merchant_res = await db.execute(
        select(MerchantProfile).where(MerchantProfile.user_id == current_user.id)
    )
    merchant = merchant_res.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")

    since = datetime.utcnow() - timedelta(days=days)

    # Total revenue from delivered orders
    revenue_res = await db.execute(
        select(func.sum(OrderItem.total_price))
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.merchant_id == merchant.id,
            Order.status == OrderStatus.delivered,
            Order.created_at >= since,
        )
    )
    total_revenue = revenue_res.scalar() or 0

    # Total orders count
    orders_res = await db.execute(
        select(func.count(func.distinct(OrderItem.order_id)))
        .where(OrderItem.merchant_id == merchant.id, OrderItem.order_id.in_(
            select(Order.id).where(Order.created_at >= since)
        ))
    )
    total_orders = orders_res.scalar() or 0

    # Total products
    total_products = (
        await db.execute(select(func.count(Product.id)).where(Product.merchant_id == merchant.id))
    ).scalar()

    # Top products by revenue
    top_res = await db.execute(
        select(
            OrderItem.product_name,
            func.sum(OrderItem.total_price).label("revenue"),
            func.sum(OrderItem.quantity).label("units_sold"),
        )
        .where(OrderItem.merchant_id == merchant.id)
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.total_price).desc())
        .limit(5)
    )
    top_products = [
        {"name": r.product_name, "revenue": r.revenue, "units_sold": r.units_sold}
        for r in top_res.fetchall()
    ]

    # Pending payout (merchant_payout for non-paid orders)
    pending_payout_res = await db.execute(
        select(func.sum(OrderItem.merchant_payout))
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.merchant_id == merchant.id,
            Order.status == OrderStatus.delivered,
        )
    )
    pending_payout = pending_payout_res.scalar() or 0

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": total_products,
        "top_products": top_products,
        "pending_payout": pending_payout,
        "period_days": days,
    }


@router.get("/commissions")
async def merchant_commissions(
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Commissions earned as a promoter."""
    result = await db.execute(
        select(Commission)
        .where(Commission.promoter_id == current_user.id)
        .order_by(Commission.created_at.desc())
    )
    return result.scalars().all()
