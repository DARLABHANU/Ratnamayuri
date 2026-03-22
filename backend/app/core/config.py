from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Ratnamayuri"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAIL_FROM: str
    EMAIL_FROM_NAME: str = "Ratnamayuri"

    # OTP
    OTP_EXPIRE_MINUTES: int = 10

    # Coupon
    COUPON_DISCOUNT_AMOUNT: int = 200
    COUPON_PROMOTER_COMMISSION: int = 100
    COUPON_PLATFORM_PROFIT: int = 100

    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    AWS_BUCKET_NAME: Optional[str] = None

    # Admin bootstrap
    ADMIN_EMAIL: str = "admin@ratnamayuri.live"
    ADMIN_PASSWORD: str = "Admin@123!"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
