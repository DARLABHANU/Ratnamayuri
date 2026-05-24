const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const AuditLog = require('../models/AuditLog');
const {
  requireAdminOrSupport,
  hashPassword,
  createImpersonationToken,
  getClientIp
} = require('../middleware/auth');

const router = express.Router();

router.use(requireAdminOrSupport);

// Look up user (account number, email, or name)
router.post('/lookup', async (req, res, next) => {
  try {
    const { account_number, email, name } = req.body;

    if (!account_number && !email && !name) {
      return res.status(400).json({ detail: 'Provide at least one search criterion' });
    }

    const conditions = [];
    if (account_number) {
      conditions.push({ account_number: account_number.toUpperCase() });
    }
    if (email) {
      conditions.push({ email: new RegExp(email, 'i') });
    }
    if (name) {
      conditions.push({ full_name: new RegExp(name, 'i') });
    }

    const query = conditions.length > 0 ? { $or: conditions } : {};
    const users = await User.find(query).limit(20);

    // Save Audit Log
    const audit = new AuditLog({
      performed_by: req.user.id,
      action: 'view_account',
      description: `Support lookup: ${JSON.stringify(req.body)}`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || '',
      metadata: { query: req.body, results_count: users.length }
    });
    await audit.save();

    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      role: u.role,
      account_number: u.account_number,
      is_active: u.is_active,
      is_verified: u.is_verified,
      avatar_url: u.avatar_url,
      created_at: u.created_at
    })));
  } catch (error) {
    next(error);
  }
});

// Impersonate User
router.post('/impersonate', async (req, res, next) => {
  try {
    const { target_user_id, reason } = req.body;

    const targetUser = await User.findOne({ id: Number(target_user_id) });
    if (!targetUser) {
      return res.status(404).json({ detail: 'Target user not found' });
    }

    // Support cannot impersonate admin or support
    if (targetUser.role === 'admin' || targetUser.role === 'support') {
      return res.status(403).json({ detail: 'Cannot impersonate admin or support users' });
    }

    // Create Audit Log
    const audit = new AuditLog({
      performed_by: req.user.id,
      target_user_id: targetUser.id,
      action: 'impersonation_start',
      description: `Impersonation started. Reason: ${reason}`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || '',
      metadata: {
        reason,
        target_email: targetUser.email,
        target_role: targetUser.role
      }
    });

    await audit.save();

    const token = createImpersonationToken(
      req.user.id,
      targetUser.id,
      audit.id
    );

    res.json({
      impersonation_token: token,
      target_user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        role: targetUser.role,
        account_number: targetUser.account_number,
        is_active: targetUser.is_active,
        is_verified: targetUser.is_verified
      },
      audit_log_id: audit.id,
      expires_in_seconds: 7200
    });
  } catch (error) {
    next(error);
  }
});

// End Impersonation
router.post('/impersonate/end/:audit_log_id', async (req, res, next) => {
  try {
    const auditLogId = Number(req.params.audit_log_id);

    const audit = new AuditLog({
      performed_by: req.user.id,
      action: 'impersonation_end',
      description: `Impersonation session ended (started at audit_log_id=${auditLogId})`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || '',
      metadata: { original_audit_log_id: auditLogId }
    });

    await audit.save();
    res.json({ message: 'Impersonation session ended and logged' });
  } catch (error) {
    next(error);
  }
});

// Get Audit Logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '50', 10)));

    const total = await AuditLog.countDocuments({});
    const logs = await AuditLog.find({})
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      items: logs,
      total,
      page,
      page_size: pageSize
    });
  } catch (error) {
    next(error);
  }
});

// View any user's orders (Support)
router.get('/user/:user_id/orders', async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const orders = await Order.find({ customer_id: userId })
      .sort({ created_at: -1 });

    // Enrich orders with items
    const orderIds = orders.map(o => o.id);
    const orderItems = await OrderItem.find({ order_id: { $in: orderIds } });

    const itemsMap = new Map();
    orderItems.forEach(item => {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, []);
      }
      itemsMap.get(item.order_id).push(item);
    });

    const enrichedOrders = orders.map(o => {
      const oObj = o.toObject();
      oObj.items = itemsMap.get(o.id) || [];
      return oObj;
    });

    res.json({
      items: enrichedOrders,
      total: enrichedOrders.length,
      page: 1,
      page_size: enrichedOrders.length,
      pages: 1
    });
  } catch (error) {
    next(error);
  }
});

// Force Reset Password (Support Reset User Password)
router.patch('/user/:user_id/reset-password', async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const { new_password } = req.body;

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ detail: 'Password too short' });
    }

    user.hashed_password = await hashPassword(new_password);
    await user.save();

    // Log action
    const audit = new AuditLog({
      performed_by: req.user.id,
      target_user_id: user.id,
      action: 'reset_password',
      description: 'Support agent reset user password',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || ''
    });
    await audit.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
