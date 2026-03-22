# Ratnamayuri — Full-Stack E-Commerce Platform

> Luxury Jewellery & Silk Sarees · Next.js 14 + FastAPI + PostgreSQL + Redis

---

## Architecture Overview

```
ratnamayuri/
├── backend/          # FastAPI Python backend
├── frontend/         # Next.js 14 App Router frontend
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js 14 (App Router), Tailwind CSS, Zustand  |
| Backend    | FastAPI, SQLAlchemy 2.0, Alembic                |
| Database   | PostgreSQL 16                                   |
| Cache      | Redis 7                                         |
| Auth       | JWT (access + refresh tokens), bcrypt           |
| Email      | aiosmtplib (SMTP)                               |
| Charts     | Recharts                                        |
| Container  | Docker + Docker Compose                         |

---

## Quick Start (Docker)

```bash
# 1. Clone and enter
cd ratnamayuri

# 2. Copy and fill env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Start all services
docker-compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API Docs → http://localhost:8000/api/docs
```

---

## Quick Start (Local Dev)

### Backend

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install deps
pip install -r requirements.txt

# Copy and edit .env
cp .env.example .env
# Edit DATABASE_URL, SMTP_*, SECRET_KEY

# Start PostgreSQL and Redis (or use Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ratnamayuri postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# Run (tables auto-created on startup, admin bootstrapped)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install deps
npm install

# Copy and edit .env
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Run
npm run dev
```

---

## Default Credentials

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| Admin    | admin@ratnamayuri.live     | Admin@123!   |

> Admin is auto-created on first backend startup from `.env` values.
> All other users register via `/auth/signup`.

---

## User Roles & Access

| Role       | Portal URL              | Description                              |
|------------|-------------------------|------------------------------------------|
| Customer   | `/customer/dashboard`   | Browse, cart, orders, profile            |
| Merchant   | `/merchant/dashboard`   | Products, orders, analytics              |
| Admin      | `/admin/dashboard`      | Full control — users, coupons, orders    |
| Support    | `/support/dashboard`    | User lookup, impersonation, audit logs   |

---

## API Endpoints Summary

### Auth  `/api/v1/auth`
| Method | Path               | Description               |
|--------|--------------------|---------------------------|
| POST   | /signup            | Register new user         |
| POST   | /login             | Login (returns JWT)       |
| POST   | /verify-otp        | Verify email OTP          |
| POST   | /resend-otp        | Resend OTP                |
| POST   | /refresh           | Refresh access token      |
| POST   | /forgot-password   | Send reset OTP            |
| POST   | /reset-password    | Reset with OTP            |
| POST   | /change-password   | Change password (auth)    |
| GET    | /me                | Get current user          |

### Products  `/api/v1/products`
| Method | Path                        | Role            |
|--------|-----------------------------|-----------------|
| GET    | /                           | Public          |
| GET    | /{id}                       | Public          |
| POST   | /                           | Merchant        |
| PUT    | /{id}                       | Merchant/Admin  |
| DELETE | /{id}                       | Merchant/Admin  |
| GET    | /merchant/my-products       | Merchant        |

### Cart  `/api/v1/cart`
| Method | Path      | Role     |
|--------|-----------|----------|
| GET    | /         | Customer |
| POST   | /add      | Customer |
| DELETE | /{id}     | Customer |
| DELETE | /         | Customer |

### Orders  `/api/v1/orders`
| Method | Path                  | Role             |
|--------|-----------------------|------------------|
| POST   | /                     | Customer         |
| GET    | /                     | Customer         |
| GET    | /{id}                 | Customer/Merchant|
| PATCH  | /{id}/status          | Merchant/Admin   |
| POST   | /validate-coupon      | Any              |
| GET    | /merchant/incoming    | Merchant         |

### Admin  `/api/v1/admin`
| Method | Path                          | Role  |
|--------|-------------------------------|-------|
| GET    | /dashboard                    | Admin |
| GET    | /users                        | Admin |
| PATCH  | /users/{id}                   | Admin |
| POST   | /users                        | Admin |
| GET    | /merchants                    | Admin |
| PATCH  | /merchants/{id}/approval      | Admin |
| GET    | /orders                       | Admin |
| GET    | /coupons                      | Admin |
| POST   | /coupons                      | Admin |
| DELETE | /coupons/{id}                 | Admin |
| GET    | /commissions                  | Admin |
| PATCH  | /commissions/{id}/pay         | Admin |
| GET    | /analytics/sales              | Admin |

### Support  `/api/v1/support`
| Method | Path                          | Role    |
|--------|-------------------------------|---------|
| POST   | /lookup                       | Support |
| POST   | /impersonate                  | Support |
| POST   | /impersonate/end/{id}         | Support |
| GET    | /audit-logs                   | Support |
| GET    | /user/{id}/orders             | Support |
| PATCH  | /user/{id}/reset-password     | Support |

---

## Coupon & Commission Logic

When a coupon is applied at checkout:
- Customer saves **₹200** discount
- Promoter earns **₹100** commission (tracked in `commissions` table)
- Platform retains **₹100** profit

Commissions are tracked with status: `pending → approved → paid`.
Admin pays commissions via `/admin/commissions/{id}/pay`.

---

## Database Schema

```
users               — id, email, role, account_number, hashed_password, is_verified
otp_codes           — user_id, code, purpose, expires_at, is_used
addresses           — user_id, line1, city, state, pincode, is_default
merchant_profiles   — user_id, business_name, commission_rate, is_approved
categories          — name, slug, parent_id
products            — merchant_id, name, price, stock_quantity, images (JSON)
cart_items          — user_id, product_id, quantity
coupons             — code, discount_amount, promoter_commission, platform_profit
orders              — customer_id, coupon_id, total_amount, status, status_history (JSON)
order_items         — order_id, product_id, quantity, unit_price
commissions         — order_id, coupon_id, promoter_id, amount, status
audit_logs          — performed_by, target_user_id, action, ip_address, metadata (JSON)
```

---

## Email System

Two emails are sent automatically:
1. **OTP Email** — on signup and forgot-password (HTML branded template)
2. **Order Confirmation** — after successful order placement

Configure SMTP in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password   # Gmail App Password
```

---

## Support Impersonation Flow

1. Support agent searches user by account number / email / name
2. Enters a reason, clicks **Start Impersonation Session**
3. Backend creates an `audit_log` entry and returns a time-limited token (2 hours)
4. All actions during the session are traceable via audit logs
5. Agent clicks **End Session** — end event is also logged

---

## Production Checklist

- [ ] Change `SECRET_KEY` to a 64-char random string
- [ ] Set `APP_ENV=production`
- [ ] Use a managed PostgreSQL (RDS / Supabase)
- [ ] Use a managed Redis (ElastiCache / Upstash)
- [ ] Set up S3 bucket for product images
- [ ] Configure real SMTP credentials
- [ ] Set `FRONTEND_URL` to your production domain
- [ ] Enable HTTPS / SSL termination
- [ ] Set up Alembic migrations pipeline

---

## License

MIT — Built with ♡ in India.
