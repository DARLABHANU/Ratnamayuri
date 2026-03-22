from datetime import datetime
import random
import string
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import (
    User, CartItem, Product, Order, OrderItem, Coupon, Commission,
    OrderStatus, PaymentStatus, UserRole
)
from app.schemas.schemas import (
    CartItemAdd, CartResponse, CartItemResponse,
    OrderCreate, OrderResponse, OrderStatusUpdate, OrderListResponse,
    CouponValidate, CouponValidateResponse,
)
from app.core.deps import get_current_user, require_customer, require_merchant_or_admin
from app.services.email_service import send_order_confirmation_email

cart_router = APIRouter(prefix="/cart", tags=["Cart"])
order_router = APIRouter(prefix="/orders", tags=["Orders"])


# ─── Cart ─────────────────────────────────────────────────────────────────────

@cart_router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product).selectinload(Product.category))
        .where(CartItem.user_id == current_user.id)
    )
    items = result.scalars().all()
    subtotal = sum(i.product.price * i.quantity for i in items if i.product)
    return CartResponse(
        items=items,
        subtotal=subtotal,
        item_count=sum(i.quantity for i in items),
    )


@cart_router.post("/add", status_code=201)
async def add_to_cart(
    payload: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check product exists
    prod_res = await db.execute(
        select(Product).where(Product.id == payload.product_id, Product.is_active == True)
    )
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock_quantity < payload.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock_quantity} in stock")

    # Upsert cart item
    existing = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == payload.product_id,
        )
    )
    cart_item = existing.scalar_one_or_none()
    if cart_item:
        cart_item.quantity = payload.quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
        db.add(cart_item)
    await db.commit()
    return {"message": "Cart updated"}


@cart_router.delete("/{item_id}", status_code=204)
async def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    await db.delete(item)
    await db.commit()


@cart_router.delete("", status_code=204)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == current_user.id)
    )
    for item in result.scalars().all():
        await db.delete(item)
    await db.commit()


# ─── Coupon validation ────────────────────────────────────────────────────────

@order_router.post("/validate-coupon", response_model=CouponValidateResponse)
async def validate_coupon(
    payload: CouponValidate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Coupon).where(Coupon.code == payload.code.upper(), Coupon.is_active == True)
    )
    coupon = result.scalar_one_or_none()

    if not coupon:
        return CouponValidateResponse(valid=False, discount_amount=0, message="Invalid coupon code")

    now = datetime.utcnow()
    if coupon.valid_until and now > coupon.valid_until:
        return CouponValidateResponse(valid=False, discount_amount=0, message="Coupon has expired")

    if now < coupon.valid_from:
        return CouponValidateResponse(valid=False, discount_amount=0, message="Coupon not yet active")

    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        return CouponValidateResponse(valid=False, discount_amount=0, message="Coupon usage limit reached")

    if payload.order_amount < coupon.min_order_amount:
        return CouponValidateResponse(
            valid=False,
            discount_amount=0,
            message=f"Minimum order amount ₹{coupon.min_order_amount:.0f} required",
        )

    return CouponValidateResponse(
        valid=True,
        discount_amount=coupon.discount_amount,
        message=f"Coupon applied! You save ₹{coupon.discount_amount:.0f}",
    )


# ─── Orders ───────────────────────────────────────────────────────────────────

def generate_order_number() -> str:
    return "RM" + "".join(random.choices(string.digits, k=10))


@order_router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Load cart
    cart_res = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.user_id == current_user.id)
    )
    cart_items = cart_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate stock
    for item in cart_items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.product.name}",
            )

    subtotal = sum(i.product.price * i.quantity for i in cart_items)
    discount_amount = 0.0
    coupon = None
    coupon_id = None

    # Apply coupon
    if payload.coupon_code:
        coupon_res = await db.execute(
            select(Coupon).where(
                Coupon.code == payload.coupon_code.upper(), Coupon.is_active == True
            )
        )
        coupon = coupon_res.scalar_one_or_none()
        if coupon:
            now = datetime.utcnow()
            if (
                (not coupon.valid_until or now <= coupon.valid_until)
                and now >= coupon.valid_from
                and (not coupon.max_uses or coupon.used_count < coupon.max_uses)
                and subtotal >= coupon.min_order_amount
            ):
                discount_amount = coupon.discount_amount
                coupon_id = coupon.id
                coupon.used_count += 1

    shipping_amount = 0.0 if subtotal >= 2999 else 99.0
    tax_amount = round(subtotal * 0.18, 2)  # 18% GST
    total_amount = subtotal - discount_amount + shipping_amount + tax_amount

    order_number = generate_order_number()
    while True:
        res = await db.execute(select(Order).where(Order.order_number == order_number))
        if not res.scalar_one_or_none():
            break
        order_number = generate_order_number()

    order = Order(
        order_number=order_number,
        customer_id=current_user.id,
        address_id=payload.address_id,
        coupon_id=coupon_id,
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_amount=shipping_amount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=OrderStatus.pending,
        payment_status=PaymentStatus.pending,
        payment_method=payload.payment_method,
        notes=payload.notes,
        status_history=[
            {"status": "pending", "timestamp": datetime.utcnow().isoformat(), "note": "Order placed"}
        ],
    )
    db.add(order)
    await db.flush()  # Get order.id

    # Create order items + reduce stock
    for item in cart_items:
        platform_fee = item.product.price * item.quantity * 0.10  # 10% platform fee
        merchant_payout = item.product.price * item.quantity - platform_fee
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            merchant_id=item.product.merchant_id,
            product_name=item.product.name,
            product_image=item.product.images[0] if item.product.images else None,
            quantity=item.quantity,
            unit_price=item.product.price,
            total_price=item.product.price * item.quantity,
            merchant_payout=merchant_payout,
            platform_fee=platform_fee,
        )
        db.add(order_item)
        item.product.stock_quantity -= item.quantity
        item.product.total_sold += item.quantity

    # Create commission record if coupon has promoter
    if coupon and coupon.promoter_id and coupon_id:
        commission = Commission(
            order_id=order.id,
            coupon_id=coupon_id,
            promoter_id=coupon.promoter_id,
            amount=coupon.promoter_commission,
        )
        db.add(commission)

    # Clear cart
    for item in cart_items:
        await db.delete(item)

    await db.commit()
    await db.refresh(order, ["items"])

    # Send confirmation email in background
    email_items = [
        {"name": i.product_name, "qty": i.quantity, "price": i.total_price}
        for i in order.items
    ]
    background_tasks.add_task(
        send_order_confirmation_email,
        current_user.email,
        current_user.full_name,
        order.order_number,
        email_items,
        order.total_amount,
    )

    return order


@order_router.get("", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: Optional[OrderStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_where = [Order.customer_id == current_user.id]
    if status:
        base_where.append(Order.status == status)

    total = (await db.execute(select(func.count(Order.id)).where(*base_where))).scalar()
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(*base_where)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = result.scalars().all()

    return OrderListResponse(
        items=orders,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@order_router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Customers can only see their own orders; merchants/admins can see all
    if current_user.role == UserRole.customer and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return order


@order_router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    order.status = payload.status

    if payload.tracking_number:
        order.tracking_number = payload.tracking_number

    if payload.status == OrderStatus.delivered:
        order.delivered_at = datetime.utcnow()
        order.payment_status = PaymentStatus.paid

    # Append to status history
    history = order.status_history or []
    history.append({
        "status": payload.status.value,
        "timestamp": datetime.utcnow().isoformat(),
        "note": payload.notes or "",
        "updated_by": current_user.id,
    })
    order.status_history = history

    await db.commit()
    await db.refresh(order, ["items"])
    return order


# ─── Merchant order view ──────────────────────────────────────────────────────

@order_router.get("/merchant/incoming", response_model=OrderListResponse)
async def merchant_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    status: Optional[OrderStatus] = None,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Orders containing items from this merchant."""
    from app.models.models import MerchantProfile
    merchant_res = await db.execute(
        select(MerchantProfile).where(MerchantProfile.user_id == current_user.id)
    )
    merchant = merchant_res.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")

    # Subquery: order_ids that have items from this merchant
    from sqlalchemy import distinct
    sq = select(distinct(OrderItem.order_id)).where(OrderItem.merchant_id == merchant.id)
    where = [Order.id.in_(sq)]
    if status:
        where.append(Order.status == status)

    total = (await db.execute(select(func.count(Order.id)).where(*where))).scalar()
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(*where)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = result.scalars().all()

    return OrderListResponse(
        items=orders,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )
