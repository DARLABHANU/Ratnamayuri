require('dotenv').config();

module.exports = {
  appName: process.env.APP_NAME || 'Ratnamayuri',
  appEnv: process.env.APP_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
  mongodbUri: process.env.MONGODB_URI || "mongodb://bhanuusr:Q7TS2QiesqiD7na9@ac-b92bkrk-shard-00-00.nji8mab.mongodb.net:27017,ac-b92bkrk-shard-00-01.nji8mab.mongodb.net:27017,ac-b92bkrk-shard-00-02.nji8mab.mongodb.net:27017/ratnamayuri?replicaSet=atlas-9x0vh4-shard-0&ssl=true&authSource=admin",
  secretKey: process.env.JWT_SECRET || process.env.SECRET_KEY || 'd13697e685f096230f8c2e91264c8d5c',
  accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '60', 10),
  refreshTokenExpireDays: parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '30', 10),
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || 'test@example.com',
  smtpPassword: process.env.SMTP_PASSWORD || 'password',
  emailFrom: process.env.EMAIL_FROM || 'test@example.com',
  emailFromName: process.env.EMAIL_FROM_NAME || 'Ratnamayuri',
  otpExpireMinutes: parseInt(process.env.OTP_EXPIRE_MINUTES || '10', 10),
  couponDiscountAmount: parseInt(process.env.COUPON_DISCOUNT_AMOUNT || '200', 10),
  couponPromoterCommission: parseInt(process.env.COUPON_PROMOTER_COMMISSION || '100', 10),
  couponPlatformProfit: parseInt(process.env.COUPON_PLATFORM_PROFIT || '100', 10),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@ratnamayuri.live',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123!',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || ''
};

