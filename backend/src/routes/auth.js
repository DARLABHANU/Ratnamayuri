const express = require('express');
const User = require('../models/User');
const {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
  getCurrentUser
} = require('../middleware/auth');
const { createAndSendOTP, verifyOTP } = require('../services/otp');
const { generateAccountNumber } = require('../utils/helpers');

const router = express.Router();

// Public Signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    // Safety checks
    if (role === 'admin' || role === 'support') {
      return res.status(403).json({ detail: 'Cannot self-register as admin/support' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ detail: 'Email already registered' });
    }

    let accountNumber = generateAccountNumber();
    while (true) {
      const existingAccount = await User.findOne({ account_number: accountNumber });
      if (!existingAccount) break;
      accountNumber = generateAccountNumber();
    }

    const hashedPassword = await hashPassword(password);
    const user = new User({
      email,
      hashed_password: hashedPassword,
      full_name,
      phone: (phone && phone.trim()) ? phone.trim() : undefined,
      role: role || 'customer',
      account_number: accountNumber,
      is_first_login: true,
      is_verified: false
    });

    await user.save();

    // Send OTP in background
    createAndSendOTP(user, 'email_verification')
      .catch(err => console.error(`Error sending signup OTP:`, err));

    res.status(201).json({
      message: 'Account created. Please verify your email with the OTP sent.',
      email: user.email,
      requires_otp: true
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email, role });
    if (!user || !(await verifyPassword(password, user.hashed_password))) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ detail: 'Account is deactivated. Contact support.' });
    }

    // Require verification for first-time logins
    if (user.is_first_login && !user.is_verified) {
      await createAndSendOTP(user, 'email_verification');
      return res.json({
        access_token: '',
        refresh_token: '',
        role: user.role,
        user_id: user.id,
        is_first_login: true,
        requires_otp: true
      });
    }

    const tokenData = { sub: String(user.id), role: user.role, email: user.email };
    const accessToken = createAccessToken(tokenData);
    const refreshToken = createRefreshToken(tokenData);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      role: user.role,
      user_id: user.id,
      is_first_login: false,
      requires_otp: false
    });
  } catch (error) {
    next(error);
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const isValid = await verifyOTP(user, otp, purpose);
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' });
    }

    user.is_verified = true;
    user.is_first_login = false;
    await user.save();

    const tokenData = { sub: String(user.id), role: user.role, email: user.email };
    const accessToken = createAccessToken(tokenData);
    const refreshToken = createRefreshToken(tokenData);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      role: user.role,
      user_id: user.id,
      is_first_login: false,
      requires_otp: false
    });
  } catch (error) {
    next(error);
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    createAndSendOTP(user, purpose)
      .catch(err => console.error(`Error resending OTP:`, err));

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
});

// Refresh Token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const decoded = decodeToken(refresh_token);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ detail: 'Invalid refresh token' });
    }

    const user = await User.findOne({ id: Number(decoded.sub) });
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: 'User not found or inactive' });
    }

    const tokenData = { sub: String(user.id), role: user.role, email: user.email };
    res.json({
      access_token: createAccessToken(tokenData),
      refresh_token: createRefreshToken(tokenData),
      role: user.role,
      user_id: user.id
    });
  } catch (error) {
    next(error);
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Return 200 regardless to prevent user scanning
    if (user) {
      createAndSendOTP(user, 'password_reset')
        .catch(err => console.error(`Forgot password OTP send failed:`, err));
    }

    res.json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (error) {
    next(error);
  }
});

// Reset Password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, new_password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const isValid = await verifyOTP(user, otp, 'password_reset');
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' });
    }

    user.hashed_password = await hashPassword(new_password);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// Change Password
router.post('/change-password', getCurrentUser, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = req.user;

    const isMatch = await verifyPassword(current_password, user.hashed_password);
    if (!isMatch) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }

    user.hashed_password = await hashPassword(new_password);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Get Current User Info
router.get('/me', getCurrentUser, async (req, res) => {
  const Coupon = require('../models/Coupon');
  const coupons = await Coupon.find({ promoter_id: req.user.id, is_active: true });
  const is_promoter = coupons.length > 0;

  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    phone: req.user.phone,
    role: req.user.role,
    account_number: req.user.account_number,
    is_active: req.user.is_active,
    is_verified: req.user.is_verified,
    avatar_url: req.user.avatar_url,
    created_at: req.user.created_at,
    is_promoter: is_promoter
  });
});

// Firebase Auth Verification and Automatic Registration callback
router.post('/firebase', async (req, res, next) => {
  try {
    const { token, role } = req.body;
    if (!token) {
      return res.status(400).json({ detail: 'Firebase Token is required' });
    }

    const { verifyFirebaseIdToken } = require('../services/firebaseAdmin');
    const decoded = await verifyFirebaseIdToken(token);

    // Extract verified phone or email from Firebase payload
    const phone = decoded.phone_number;
    const email = decoded.email;

    if (!phone && !email) {
      return res.status(400).json({ detail: 'Firebase payload has neither phone nor email' });
    }

    let user;
    if (phone) {
      // Find by verified phone
      user = await User.findOne({ phone });
    } else if (email) {
      // Find by verified email
      user = await User.findOne({ email });
    }

    // Auto-register if user doesn't exist
    if (!user) {
      const { generateAccountNumber } = require('../utils/helpers');
      const { hashPassword } = require('../middleware/auth');
      
      let accountNumber = generateAccountNumber();
      while (true) {
        const existingAccount = await User.findOne({ account_number: accountNumber });
        if (!existingAccount) break;
        accountNumber = generateAccountNumber();
      }

      // Generate a strong random password placeholder
      const randomPass = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPass);

      user = new User({
        email: email || `${phone.replace('+', '')}@ratnamayuri.phone`,
        hashed_password: hashedPassword,
        full_name: decoded.name || 'Valued Customer',
        phone: phone || undefined,
        role: role || 'customer',
        account_number: accountNumber,
        is_first_login: false,
        is_verified: true
      });

      await user.save();
    }

    // Generate local JWT access & refresh tokens
    const { createAccessToken, createRefreshToken } = require('../middleware/auth');
    const tokenData = { sub: String(user.id), role: user.role, email: user.email };
    const accessToken = createAccessToken(tokenData);
    const refreshToken = createRefreshToken(tokenData);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      role: user.role,
      user_id: user.id,
      is_first_login: false,
      requires_otp: false
    });
  } catch (error) {
    console.error('Firebase Auth callback error:', error);
    res.status(401).json({ detail: 'Invalid or expired Firebase ID token' });
  }
});

// Update Payout Settings (Bank details & UPI account)
router.put('/payout-settings', getCurrentUser, async (req, res, next) => {
  try {
    const {
      payout_bank_name,
      payout_account_number,
      payout_ifsc_code,
      payout_account_holder_name,
      payout_upi_id
    } = req.body;

    const user = req.user;

    user.payout_bank_name = payout_bank_name !== undefined ? payout_bank_name : user.payout_bank_name;
    user.payout_account_number = payout_account_number !== undefined ? payout_account_number : user.payout_account_number;
    user.payout_ifsc_code = payout_ifsc_code !== undefined ? payout_ifsc_code : user.payout_ifsc_code;
    user.payout_account_holder_name = payout_account_holder_name !== undefined ? payout_account_holder_name : user.payout_account_holder_name;
    user.payout_upi_id = payout_upi_id !== undefined ? payout_upi_id : user.payout_upi_id;

    await user.save();

    res.json({
      message: 'Payout settings updated successfully',
      user: {
        id: user.id,
        email: user.email,
        payout_bank_name: user.payout_bank_name,
        payout_account_number: user.payout_account_number,
        payout_ifsc_code: user.payout_ifsc_code,
        payout_account_holder_name: user.payout_account_holder_name,
        payout_upi_id: user.payout_upi_id
      }
    });
  } catch (error) {
    next(error);
  }
});

// Request Passwordless Magic Link (Option 2)
router.post('/magic-link-request', async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ detail: 'Please provide a valid email address' });
    }

    const targetRole = role || 'customer';
    if (targetRole === 'admin' || targetRole === 'support') {
      return res.status(403).json({ detail: 'Cannot request passwordless links for administrative roles' });
    }

    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const { sendPasswordlessLoginLink } = require('../services/email');

    // Create a 15-minute token
    const token = jwt.sign(
      { email: email.trim().toLowerCase(), role: targetRole, type: 'magic_link' },
      config.secretKey,
      { expiresIn: '15m' }
    );

    const verificationLink = `${config.frontendUrl}/auth/verify-link?token=${token}`;
    
    // Send email asynchronously
    sendPasswordlessLoginLink(email.trim().toLowerCase(), verificationLink)
      .catch(err => console.error('Error sending passwordless login email:', err));

    res.json({ message: 'Secure checkout link successfully dispatched to your email inbox.' });
  } catch (error) {
    next(error);
  }
});

// Verify Custom Passwordless Token (Option 2)
router.post('/verify-magic-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ detail: 'Verification token is required' });
    }

    const jwt = require('jsonwebtoken');
    const config = require('../config');

    let decoded;
    try {
      decoded = jwt.verify(token, config.secretKey);
    } catch (err) {
      return res.status(401).json({ detail: 'Your sign-in link has expired or is invalid. Please request a new one.' });
    }

    if (!decoded || decoded.type !== 'magic_link') {
      return res.status(401).json({ detail: 'Invalid token structure' });
    }

    const email = decoded.email;
    const role = decoded.role || 'customer';

    let user = await User.findOne({ email });

    // Auto-register if user doesn't exist
    if (!user) {
      const { generateAccountNumber } = require('../utils/helpers');
      const { hashPassword } = require('../middleware/auth');
      
      let accountNumber = generateAccountNumber();
      while (true) {
        const existingAccount = await User.findOne({ account_number: accountNumber });
        if (!existingAccount) break;
        accountNumber = generateAccountNumber();
      }

      // Generate a strong random password placeholder
      const randomPass = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPass);

      user = new User({
        email,
        hashed_password: hashedPassword,
        full_name: 'Valued Customer',
        role,
        account_number: accountNumber,
        is_first_login: false,
        is_verified: true
      });

      await user.save();
    }

    if (!user.is_active) {
      return res.status(403).json({ detail: 'Account is deactivated. Contact support.' });
    }

    // Mark as verified & not first login since magic link verifies the email
    if (!user.is_verified || user.is_first_login) {
      user.is_verified = true;
      user.is_first_login = false;
      await user.save();
    }

    // Generate local JWT access & refresh tokens
    const { createAccessToken, createRefreshToken } = require('../middleware/auth');
    const tokenData = { sub: String(user.id), role: user.role, email: user.email };
    const accessToken = createAccessToken(tokenData);
    const refreshToken = createRefreshToken(tokenData);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      role: user.role,
      user_id: user.id,
      is_first_login: false,
      requires_otp: false
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

