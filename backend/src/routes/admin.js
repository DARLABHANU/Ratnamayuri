const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Coupon = require('../models/Coupon');
const Commission = require('../models/Commission');
const MerchantProfile = require('../models/MerchantProfile');
const { requireAdmin, requireAdminOrSupport, hashPassword } = require('../middleware/auth');
const { generateAccountNumber } = require('../utils/helpers');

const router = express.Router();

// Helper to enrich Orders with items
const enrichOrders = async (orders) => {
  const isArray = Array.isArray(orders);
  const items = isArray ? orders : [orders];

  const orderIds = items.map(o => o.id);
  const orderItems = await OrderItem.find({ order_id: { $in: orderIds } });

  const itemsMap = new Map();
  orderItems.forEach(item => {
    if (!itemsMap.has(item.order_id)) {
      itemsMap.set(item.order_id, []);
    }
    itemsMap.get(item.order_id).push(item);
  });

  const enriched = items.map(o => {
    const oObj = o.toObject();
    oObj.items = itemsMap.get(o.id) || [];
    return oObj;
  });

  return isArray ? enriched : enriched[0];
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    const total_users = await User.countDocuments({ role: 'customer' });
    const total_merchants = await User.countDocuments({ role: 'merchant' });
    const total_orders = await Order.countDocuments({});

    // Sum revenue from delivered orders
    const deliveredOrders = await Order.find({ status: 'delivered' });
    const total_revenue = deliveredOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const pending_orders = await Order.countDocuments({ status: 'pending' });
    const active_coupons = await Coupon.countDocuments({ is_active: true });

    // Recent orders
    const recentOrders = await Order.find({})
      .sort({ created_at: -1 })
      .limit(10);
    const enrichedRecent = await enrichOrders(recentOrders);

    res.json({
      total_users,
      total_merchants,
      total_orders,
      total_revenue,
      pending_orders,
      active_coupons,
      recent_orders: enrichedRecent
    });
  } catch (error) {
    next(error);
  }
});

// ─── User Management ──────────────────────────────────────────────────────────

// List users
router.get('/users', requireAdminOrSupport, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const { role, search } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { email: new RegExp(search, 'i') },
        { full_name: new RegExp(search, 'i') },
        { account_number: new RegExp(search, 'i') }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      items: users.map(u => ({
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
      })),
      total,
      page,
      page_size: pageSize
    });
  } catch (error) {
    next(error);
  }
});

// Get user
router.get('/users/:user_id', requireAdminOrSupport, async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user
router.patch('/users/:user_id', requireAdminOrSupport, async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    Object.assign(user, req.body);
    await user.save();

    // Sync: If the user's role is merchant, automatically align their profile approval status
    if (user.role === 'merchant' && req.body.is_verified !== undefined) {
      await MerchantProfile.updateOne(
        { user_id: user.id },
        { is_approved: user.is_verified }
      );
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Create internal support/admin user
router.post('/users', requireAdmin, async (req, res, next) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (role !== 'admin' && role !== 'support') {
      return res.status(400).json({ detail: 'Can only create admin/support via this endpoint' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ detail: 'Email already exists' });
    }

    const accountNumber = generateAccountNumber();
    const hashedPassword = await hashPassword(password);

    const user = new User({
      email,
      hashed_password: hashedPassword,
      full_name,
      role,
      account_number: accountNumber,
      is_verified: true,
      is_first_login: false
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// ─── Merchant Management ──────────────────────────────────────────────────────

// List merchants
router.get('/merchants', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const isApproved = req.query.is_approved !== undefined ? req.query.is_approved === 'true' : null;

    const filter = {};
    if (isApproved !== null) {
      filter.is_approved = isApproved;
    }

    const total = await MerchantProfile.countDocuments(filter);
    const merchants = await MerchantProfile.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // Enrich with user account details
    const userIds = merchants.map(m => m.user_id);
    const users = await User.find({ id: { $in: userIds } });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedMerchants = merchants.map(m => {
      const mObj = m.toObject();
      mObj.user = userMap.get(m.user_id) || null;
      return mObj;
    });

    res.json({
      items: enrichedMerchants,
      total,
      page,
      page_size: pageSize
    });
  } catch (error) {
    next(error);
  }
});

// Approve / configure Merchant Profile
router.patch('/merchants/:merchant_id/approval', requireAdmin, async (req, res, next) => {
  try {
    const merchantId = Number(req.params.merchant_id);
    const { is_approved, commission_rate } = req.body;

    const merchant = await MerchantProfile.findOne({ id: merchantId });
    if (!merchant) {
      return res.status(404).json({ detail: 'Merchant not found' });
    }

    if (is_approved !== undefined) {
      merchant.is_approved = is_approved;
    }
    if (commission_rate !== undefined) {
      merchant.commission_rate = Number(commission_rate);
    }

    await merchant.save();

    // Sync: Also update the associated User's verification status
    if (is_approved !== undefined) {
      await User.updateOne(
        { id: merchant.user_id },
        { is_verified: is_approved }
      );
    }

    res.json(merchant);
  } catch (error) {
    next(error);
  }
});

// ─── Order Management ─────────────────────────────────────────────────────────

// List all orders (Admin)
router.get('/orders', requireAdminOrSupport, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const status = req.query.status || null;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const enriched = await enrichOrders(orders);

    res.json({
      items: enriched,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// ─── Coupon Management ────────────────────────────────────────────────────────

// List Coupons
router.get('/coupons', requireAdmin, async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ created_at: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
});

// Create Coupon
router.post('/coupons', requireAdmin, async (req, res, next) => {
  try {
    const payload = req.body;
    const code = payload.code.toUpperCase();

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(409).json({ detail: 'Coupon code already exists' });
    }

    let promoter_id = payload.promoter_id;
    if (promoter_id) {
      let userObj = null;
      const idStr = String(promoter_id).trim();
      if (idStr.startsWith('#') || idStr.toUpperCase().startsWith('RM')) {
        const accNum = (idStr.startsWith('#') ? idStr.substring(1) : idStr).toUpperCase();
        userObj = await User.findOne({ account_number: accNum });
      } else if (isNaN(Number(idStr))) {
        userObj = await User.findOne({ account_number: idStr.toUpperCase() });
      } else {
        const numVal = Number(idStr);
        userObj = await User.findOne({ 
          $or: [
            { id: numVal }, 
            { account_number: idStr.toUpperCase() }, 
            { account_number: ('#' + idStr).toUpperCase() },
            { account_number: ('RM' + idStr).toUpperCase() }
          ] 
        });
      }

      if (userObj) {
        payload.promoter_id = userObj.id;
      } else {
        return res.status(404).json({ detail: `Customer with ID/Account Number '${promoter_id}' not found` });
      }
    } else {
      payload.promoter_id = null;
    }

    const coupon = new Coupon({
      ...payload,
      code,
      created_by: req.user.id
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
});

// Update Coupon
router.patch('/coupons/:coupon_id', requireAdmin, async (req, res, next) => {
  try {
    const couponId = Number(req.params.coupon_id);
    const coupon = await Coupon.findOne({ id: couponId });
    if (!coupon) {
      return res.status(404).json({ detail: 'Coupon not found' });
    }

    if (req.body.hasOwnProperty('promoter_id')) {
      let promoter_id = req.body.promoter_id;
      if (promoter_id) {
        let userObj = null;
        const idStr = String(promoter_id).trim();
        if (idStr.startsWith('#') || idStr.toUpperCase().startsWith('RM')) {
          const accNum = (idStr.startsWith('#') ? idStr.substring(1) : idStr).toUpperCase();
          userObj = await User.findOne({ account_number: accNum });
        } else if (isNaN(Number(idStr))) {
          userObj = await User.findOne({ account_number: idStr.toUpperCase() });
        } else {
          const numVal = Number(idStr);
          userObj = await User.findOne({ 
            $or: [
              { id: numVal }, 
              { account_number: idStr.toUpperCase() }, 
              { account_number: ('#' + idStr).toUpperCase() },
              { account_number: ('RM' + idStr).toUpperCase() }
            ] 
          });
        }

        if (userObj) {
          req.body.promoter_id = userObj.id;
        } else {
          return res.status(404).json({ detail: `Customer with ID/Account Number '${promoter_id}' not found` });
        }
      } else {
        req.body.promoter_id = null;
      }
    }

    Object.assign(coupon, req.body);
    await coupon.save();

    res.json(coupon);
  } catch (error) {
    next(error);
  }
});

// Soft Delete Coupon (Set Inactive)
router.delete('/coupons/:coupon_id', requireAdmin, async (req, res, next) => {
  try {
    const couponId = Number(req.params.coupon_id);
    const coupon = await Coupon.findOne({ id: couponId });
    if (!coupon) {
      return res.status(404).json({ detail: 'Coupon not found' });
    }

    coupon.is_active = false;
    await coupon.save();

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// ─── Commissions ──────────────────────────────────────────────────────────────

// List commissions
router.get('/commissions', requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status || null;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const commissions = await Commission.find(filter).sort({ created_at: -1 });
    res.json(commissions);
  } catch (error) {
    next(error);
  }
});

// Pay Promoter Commission
router.patch('/commissions/:commission_id/pay', requireAdmin, async (req, res, next) => {
  try {
    const commissionId = Number(req.params.commission_id);
    const commission = await Commission.findOne({ id: commissionId });
    if (!commission) {
      return res.status(404).json({ detail: 'Commission not found' });
    }

    commission.status = 'paid';
    commission.paid_at = new Date();
    await commission.save();

    res.json(commission);
  } catch (error) {
    next(error);
  }
});

// ─── Sales Analytics ──────────────────────────────────────────────────────────

router.get('/analytics/sales', requireAdmin, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await Order.find({ created_at: { $gte: since } });
    const total_orders = orders.length;

    // Filter cancelled ones for total revenue calculation
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const total_revenue = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const avg_order_value = total_orders > 0 ? total_revenue / total_orders : 0;

    // Tally by status
    const orders_by_status = {};
    orders.forEach(o => {
      orders_by_status[o.status] = (orders_by_status[o.status] || 0) + 1;
    });

    res.json({
      total_revenue,
      total_orders,
      avg_order_value: Math.round(avg_order_value * 100) / 100,
      orders_by_status,
      period_days: days
    });
  } catch (error) {
    next(error);
  }
});

// ─── Product Moderation ──────────────────────────────────────────────────────

// List all products for review / moderation (Admin)
router.get('/products', requireAdminOrSupport, async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const isApproved = req.query.is_approved !== undefined ? req.query.is_approved === 'true' : null;

    const filter = {};
    if (isApproved !== null) {
      filter.is_approved = isApproved;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      items: products,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Approve or reject a product (Admin)
router.patch('/products/:product_id/approve', requireAdminOrSupport, async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const productId = Number(req.params.product_id);
    const { is_approved } = req.body;

    if (is_approved === undefined) {
      return res.status(400).json({ detail: 'Missing is_approved parameter in request body' });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    product.is_approved = is_approved;
    await product.save();

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// ─── Withdrawal Requests (Admin) ─────────────────────────────────────────────

// List all withdrawal requests
router.get('/withdrawals', requireAdminOrSupport, async (req, res, next) => {
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const status = req.query.status || null;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const total = await WithdrawalRequest.countDocuments(filter);
    const requests = await WithdrawalRequest.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // Enrich with Merchant Profile details
    const merchantIds = requests.map(r => r.merchant_id);
    const profiles = await MerchantProfile.find({ id: { $in: merchantIds } });
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const enriched = requests.map(r => {
      const rObj = r.toObject();
      rObj.merchant = profileMap.get(r.merchant_id) || null;
      return rObj;
    });

    res.json({
      items: enriched,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Approve or Reject Withdrawal
router.patch('/withdrawals/:id/approval', requireAdmin, async (req, res, next) => {
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const Wallet = require('../models/Wallet');
    const AuditLog = require('../models/AuditLog');
    
    const requestId = Number(req.params.id);
    const { status } = req.body; // 'approved' or 'rejected'

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ detail: 'Status must be approved or rejected' });
    }

    const request = await WithdrawalRequest.findOne({ id: requestId });
    if (!request) {
      return res.status(404).json({ detail: 'Withdrawal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ detail: 'Request is already processed' });
    }

    request.status = status;
    request.processed_at = new Date();
    await request.save();

    // If rejected, refund the money back to merchant available balance
    if (status === 'rejected') {
      let wallet = await Wallet.findOne({ merchant_id: request.merchant_id });
      if (wallet) {
        wallet.available_balance = Number(((wallet.available_balance || 0) + request.amount).toFixed(2));
        wallet.withdrawn_balance = Number(Math.max(0, (wallet.withdrawn_balance || 0) - request.amount).toFixed(2));
        await wallet.save();
      }
    }

    console.log(`[Withdrawal] Admin ${status} request #${request.id} for ₹${request.amount}`);

    // Audit log
    const audit = new AuditLog({
      action_type: `withdrawal_${status}`,
      actor_id: req.user.id,
      actor_email: req.user.email,
      target_id: request.id,
      target_type: 'WithdrawalRequest',
      details: `Withdrawal request for ₹${request.amount} was ${status} by admin.`,
      timestamp: new Date()
    });
    await audit.save();

    res.json(request);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
