const crypto = require('crypto');
const OTPCode = require('../models/OTPCode');
const config = require('../config');
const { sendOTPEmail } = require('./email');

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  return otp;
};

const createAndSendOTP = async (user, purpose = 'email_verification') => {
  // Invalidate old OTPs for this user and purpose
  await OTPCode.updateMany(
    { user_id: user.id, purpose, is_used: false },
    { is_used: true }
  );

  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpireMinutes);

  const otp = new OTPCode({
    user_id: user.id,
    code: otpCode,
    purpose,
    expires_at: expiresAt
  });

  await otp.save();

  // Log to terminal console for development convenience
  console.log(`\n======================================================`);
  console.log(`[DEV OTP] Verification code for ${user.email} (${purpose}): ${otpCode}`);
  console.log(`======================================================\n`);

  // Send email in background asynchronously
  sendOTPEmail(user.email, user.full_name, otpCode, purpose)
    .catch(err => console.error(`Background OTP email failed:`, err));

  return true;
};

const verifyOTP = async (user, code, purpose = 'email_verification') => {
  const otp = await OTPCode.findOne({
    user_id: user.id,
    code,
    purpose,
    is_used: false
  });

  if (!otp) {
    return false;
  }

  const now = new Date();
  if (now > otp.expires_at) {
    return false;
  }

  // Mark as used
  otp.is_used = true;
  await otp.save();
  return true;
};

module.exports = {
  generateOTP,
  createAndSendOTP,
  verifyOTP
};
