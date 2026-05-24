const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const createAccessToken = (data) => {
  return jwt.sign(
    { ...data, type: 'access' },
    config.secretKey,
    { expiresIn: `${config.accessTokenExpireMinutes}m` }
  );
};

const createRefreshToken = (data) => {
  return jwt.sign(
    { ...data, type: 'refresh' },
    config.secretKey,
    { expiresIn: `${config.refreshTokenExpireDays}d` }
  );
};

const createImpersonationToken = (supportUserId, targetUserId, auditLogId) => {
  return jwt.sign(
    {
      sub: String(targetUserId),
      impersonated_by: supportUserId,
      audit_log_id: auditLogId,
      is_impersonation: true,
      type: 'impersonation'
    },
    config.secretKey,
    { expiresIn: '2h' }
  );
};

const decodeToken = (token) => {
  try {
    return jwt.verify(token, config.secretKey);
  } catch (error) {
    return null;
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const payload = decodeToken(token);

    if (!payload || !payload.sub) {
      return res.status(401).json({ detail: 'Could not validate credentials' });
    }

    const user = await User.findOne({ id: Number(payload.sub) });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ detail: 'Account is deactivated' });
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        detail: `Access denied. Required roles: ${JSON.stringify(roles)}`
      });
    }
    next();
  };
};

const requireCustomer = [getCurrentUser, requireRole('customer')];
const requireMerchant = [getCurrentUser, requireRole('merchant')];
const requireAdmin = [getCurrentUser, requireRole('admin')];
const requireSupport = [getCurrentUser, requireRole('support')];
const requireAdminOrSupport = [getCurrentUser, requireRole('admin', 'support')];
const requireMerchantOrAdmin = [getCurrentUser, requireRole('merchant', 'admin')];

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
};

const getImpersonationContext = (req) => {
  if (req.tokenPayload && req.tokenPayload.is_impersonation) {
    return {
      target_user_id: Number(req.tokenPayload.sub),
      performed_by: req.tokenPayload.impersonated_by,
      audit_log_id: req.tokenPayload.audit_log_id
    };
  }
  return null;
};

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  createImpersonationToken,
  decodeToken,
  getCurrentUser,
  requireRole,
  requireCustomer,
  requireMerchant,
  requireAdmin,
  requireSupport,
  requireAdminOrSupport,
  requireMerchantOrAdmin,
  getClientIp,
  getImpersonationContext
};
