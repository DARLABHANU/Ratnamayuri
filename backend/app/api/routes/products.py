import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import Product, MerchantProfile, User, UserRole, Category
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
)
from app.core.deps import get_current_user, require_merchant_or_admin, require_admin

router = APIRouter(prefix="/products", tags=["Products"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


async def _get_merchant_profile(db: AsyncSession, user: User) -> MerchantProfile:
    result = await db.execute(
        select(MerchantProfile).where(MerchantProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Merchant profile not found")
    if not profile.is_approved and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Merchant account not yet approved")
    return profile


# ─── Public endpoints ─────────────────────────────────────────────────────────

@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = Query("created_at", regex="^(price|created_at|rating_avg|total_sold)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.is_active == True)
    )
    count_query = select(func.count(Product.id)).where(Product.is_active == True)

    if category_id:
        query = query.where(Product.category_id == category_id)
        count_query = count_query.where(Product.category_id == category_id)
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
        count_query = count_query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
        count_query = count_query.where(Product.price <= max_price)
    if is_featured is not None:
        query = query.where(Product.is_featured == is_featured)
        count_query = count_query.where(Product.is_featured == is_featured)

    sort_col = getattr(Product, sort_by)
    query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        items=products,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id, Product.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ─── Merchant / Admin endpoints ───────────────────────────────────────────────

@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.merchant:
        merchant = await _get_merchant_profile(db, current_user)
        merchant_id = merchant.id
    else:
        raise HTTPException(status_code=400, detail="Admin should specify merchant_id via admin route")

    slug = slugify(payload.name)
    # Ensure unique slug
    base_slug = slug
    counter = 1
    while True:
        res = await db.execute(select(Product).where(Product.slug == slug))
        if not res.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    product = Product(
        merchant_id=merchant_id,
        slug=slug,
        **payload.model_dump(exclude_unset=False),
    )
    db.add(product)
    await db.commit()
    await db.refresh(product, ["category"])
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Merchant can only edit their own products
    if current_user.role == UserRole.merchant:
        merchant = await _get_merchant_profile(db, current_user)
        if product.merchant_id != merchant.id:
            raise HTTPException(status_code=403, detail="Not your product")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product, ["category"])
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user.role == UserRole.merchant:
        merchant = await _get_merchant_profile(db, current_user)
        if product.merchant_id != merchant.id:
            raise HTTPException(status_code=403, detail="Not your product")

    product.is_active = False  # Soft delete
    await db.commit()


@router.get("/merchant/my-products", response_model=ProductListResponse)
async def merchant_my_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_merchant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    merchant = await _get_merchant_profile(db, current_user)
    query = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.merchant_id == merchant.id)
    )
    count_q = select(func.count(Product.id)).where(Product.merchant_id == merchant.id)

    total = (await db.execute(count_q)).scalar()
    products = (await db.execute(query.offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return ProductListResponse(
        items=products,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )
