import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.db.session import engine, AsyncSessionLocal
from app.db.session import Base

# Import all models so Alembic/SQLAlchemy sees them
from app.models import models  # noqa: F401

from app.api.routes import auth, products, orders, admin, support, merchant, addresses


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info(f"Starting {settings.APP_NAME} API in {settings.APP_ENV} mode")

    # Create tables (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Bootstrap admin user if not exists
    await _bootstrap_admin()

    yield

    logger.info("Shutting down...")
    await engine.dispose()


async def _bootstrap_admin():
    """Create the default admin user if no admin exists."""
    from sqlalchemy import select
    from app.models.models import User, UserRole
    from app.core.security import hash_password
    import random, string

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.role == UserRole.admin)
        )
        if result.scalar_one_or_none():
            return

        account_number = "RMADMIN0001"
        admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name="Super Admin",
            role=UserRole.admin,
            account_number=account_number,
            is_verified=True,
            is_first_login=False,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        logger.info(f"Admin user bootstrapped: {settings.ADMIN_EMAIL}")


app = FastAPI(
    title="Ratnamayuri API",
    description="Production-ready e-commerce API for Ratnamayuri — Luxury Jewellery & Silk Sarees",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(orders.cart_router, prefix=API_PREFIX)
app.include_router(orders.order_router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(support.router, prefix=API_PREFIX)
app.include_router(merchant.router, prefix=API_PREFIX)
app.include_router(addresses.router, prefix=API_PREFIX)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/api/docs"}
