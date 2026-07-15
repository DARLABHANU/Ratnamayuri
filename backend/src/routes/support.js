const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const AuditLog = require('../models/AuditLog');
const SupportTicket = require('../models/SupportTicket');
const {
  requireAdminOrSupport,
  hashPassword,
  createImpersonationToken,
  getClientIp,
  getCurrentUser
} = require('../middleware/auth');

const router = express.Router();

// ── CUSTOMER SUPPORT TICKET ROUTE HANDLERS ────────────────────────────────────

// Create support ticket (Customer)
router.post('/tickets', getCurrentUser, async (req, res, next) => {
  try {
    const { subject, category, priority, message, order_id } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ detail: 'Subject, category, and message are required' });
    }

    const ticket = new SupportTicket({
      user_id: req.user.id,
      subject,
      category,
      priority: priority || 'medium',
      order_id: order_id || null,
      status: 'open',
      replies: [{
        sender_id: req.user.id,
        sender_name: req.user.full_name,
        sender_role: req.user.role,
        message: message
      }]
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

// List logged-in customer's tickets
router.get('/tickets', getCurrentUser, async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.id })
      .sort({ updated_at: -1 });
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

// Get all support tickets (Support/Admin only)
router.get('/tickets/all', requireAdminOrSupport, async (req, res, next) => {
  try {
    const { status, priority, category, page = 1, page_size = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const pageNum = Math.max(1, parseInt(page, 10));
    const sizeNum = Math.min(100, Math.max(1, parseInt(page_size, 10)));

    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .sort({ updated_at: -1 })
      .skip((pageNum - 1) * sizeNum)
      .limit(sizeNum);

    res.json({
      items: tickets,
      total,
      page: pageNum,
      page_size: sizeNum
    });
  } catch (error) {
    next(error);
  }
});

// Get a single ticket details (Customer or Support/Admin)
router.get('/tickets/:id', getCurrentUser, async (req, res, next) => {
  try {
    const ticketId = Number(req.params.id);
    const ticket = await SupportTicket.findOne({ id: ticketId });

    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }

    // Ensure customer owns the ticket, or requesting user is support/admin
    const isAgent = ['admin', 'support'].includes(req.user.role);
    if (ticket.user_id !== req.user.id && !isAgent) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// Customer reply to a ticket
router.post('/tickets/:id/reply', getCurrentUser, async (req, res, next) => {
  try {
    const ticketId = Number(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ detail: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }

    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    // Push new reply
    ticket.replies.push({
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      sender_role: req.user.role,
      message
    });

    // Re-open ticket if it was resolved
    if (ticket.status === 'resolved') {
      ticket.status = 'open';
    }

    ticket.updated_at = new Date();
    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});


// ── AGENT SUPPORT TICKET ROUTE HANDLERS ───────────────────────────────────────

// Update support ticket status/priority (Support/Admin only)
router.patch('/tickets/:id/status', requireAdminOrSupport, async (req, res, next) => {
  try {
    const ticketId = Number(req.params.id);
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }

    if (status) {
      if (!['open', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ detail: 'Invalid status value' });
      }
      ticket.status = status;
    }

    if (priority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ detail: 'Invalid priority value' });
      }
      ticket.priority = priority;
    }

    ticket.updated_at = new Date();
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// Agent reply to a ticket (Support/Admin only)
router.post('/tickets/:id/agent-reply', requireAdminOrSupport, async (req, res, next) => {
  try {
    const ticketId = Number(req.params.id);
    const { message, status } = req.body;

    if (!message) {
      return res.status(400).json({ detail: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }

    // Append agent reply
    ticket.replies.push({
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      sender_role: req.user.role,
      message
    });

    // Auto-update status to in_progress or resolve as selected
    ticket.status = status || 'in_progress';
    ticket.updated_at = new Date();

    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});


// ── AGENT ACCESS ROUTE HANDLERS ───────────────────────────────────────────────

// Look up user (account number, email, or name)
router.post('/lookup', requireAdminOrSupport, async (req, res, next) => {
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
router.post('/impersonate', requireAdminOrSupport, async (req, res, next) => {
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
router.post('/impersonate/end/:audit_log_id', requireAdminOrSupport, async (req, res, next) => {
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
router.get('/audit-logs', requireAdminOrSupport, async (req, res, next) => {
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
router.get('/user/:user_id/orders', requireAdminOrSupport, async (req, res, next) => {
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
router.patch('/user/:user_id/reset-password', requireAdminOrSupport, async (req, res, next) => {
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
