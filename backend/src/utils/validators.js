const REGEX_INDIAN_PHONE = /^[6-9]\d{9}$/;
const REGEX_INDIAN_PINCODE = /^[1-9][0-9]{5}$/;
const REGEX_BANK_ACCOUNT = /^\d{9,18}$/;
const REGEX_IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const REGEX_UPI_ID = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2-64}$/;
const REGEX_GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const REGEX_COUPON = /^[A-Z0-9]{3,15}$/;

const validatePhone = (phone) => REGEX_INDIAN_PHONE.test(phone);
const validatePincode = (pincode) => REGEX_INDIAN_PINCODE.test(pincode);
const validateBankAccount = (acc) => REGEX_BANK_ACCOUNT.test(acc);
const validateIFSC = (ifsc) => REGEX_IFSC.test(ifsc);
const validateUPI = (upi) => REGEX_UPI_ID.test(upi);
const validateGSTIN = (gstin) => REGEX_GSTIN.test(gstin);
const validateCoupon = (code) => REGEX_COUPON.test(code);

const validatePassword = (password) => {
  if (!password || password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long.' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least 1 uppercase letter.' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least 1 lowercase letter.' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least 1 numeric digit.' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, message: 'Password must contain at least 1 special character (!@#$%^&*).' };
  return { valid: true };
};

module.exports = {
  REGEX_INDIAN_PHONE,
  REGEX_INDIAN_PINCODE,
  REGEX_BANK_ACCOUNT,
  REGEX_IFSC,
  REGEX_UPI_ID,
  REGEX_GSTIN,
  REGEX_COUPON,
  validatePhone,
  validatePincode,
  validateBankAccount,
  validateIFSC,
  validateUPI,
  validateGSTIN,
  validateCoupon,
  validatePassword
};
