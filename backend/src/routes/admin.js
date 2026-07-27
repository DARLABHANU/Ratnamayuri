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

    // Sum revenue from delivered orders via DB-level aggregation
    const revenueAggregation = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const total_revenue = revenueAggregation[0]?.total || 0;

    // Sum platform profit from delivered orders via DB-level aggregation lookup
    const profitAggregation = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      { $match: { 'order.status': 'delivered' } },
      { $group: { _id: null, total: { $sum: '$platform_fee' } } }
    ]);
    const total_profit = Number((profitAggregation[0]?.total || 0).toFixed(2));

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
      total_profit,
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

    // Whitelist allowed fields to prevent mass assignment (e.g., setting hashed_password directly)
    const allowedFields = ['full_name', 'email', 'phone', 'role', 'is_active', 'is_verified', 'avatar_url'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
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

    const discount_type = 'fixed';
    const discount_value = 199;
    const discount_amount = 199;

    const coupon = new Coupon({
      ...payload,
      code,
      discount_type,
      discount_value,
      discount_amount,
      promoter_commission: Number(payload.promoter_commission) || 100,
      platform_profit: Number(payload.platform_profit) || 30,
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
    
    // Resolve promoter details (Bank account & UPI info)
    const User = require('../models/User');
    const promoterIds = [...new Set(commissions.map(c => c.promoter_id))];
    const promoters = await User.find({ id: { $in: promoterIds } });
    const promoterMap = new Map(promoters.map(p => [p.id, p]));

    const enriched = commissions.map(c => {
      const cObj = c.toObject();
      const promoter = promoterMap.get(c.promoter_id);
      cObj.promoter = promoter ? {
        id: promoter.id,
        email: promoter.email,
        full_name: promoter.full_name,
        payout_bank_name: promoter.payout_bank_name,
        payout_account_number: promoter.payout_account_number,
        payout_ifsc_code: promoter.payout_ifsc_code,
        payout_account_holder_name: promoter.payout_account_holder_name,
        payout_upi_id: promoter.payout_upi_id
      } : null;
      return cObj;
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// Pay Promoter Commission
router.patch('/commissions/:commission_id/pay', requireAdmin, async (req, res, next) => {
  try {
    const commissionId = Number(req.params.commission_id);
    const { notes } = req.body;

    const commission = await Commission.findOne({ id: commissionId });
    if (!commission) {
      return res.status(404).json({ detail: 'Commission not found' });
    }

    commission.status = 'paid';
    commission.paid_at = new Date();
    if (notes !== undefined) {
      commission.notes = notes;
    }
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

// List settlements (Admin)
router.get('/settlements', requireAdmin, async (req, res, next) => {
  try {
    const Settlement = require('../models/Settlement');
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const status = req.query.status || null;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const total = await Settlement.countDocuments(filter);
    const settlements = await Settlement.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // Enrich with order number & business name
    const orderIds = settlements.map(s => s.order_id);
    const merchantIds = settlements.map(s => s.merchant_id);

    const Order = require('../models/Order');
    const MerchantProfile = require('../models/MerchantProfile');

    const [orders, profiles] = await Promise.all([
      Order.find({ id: { $in: orderIds } }, 'id order_number'),
      MerchantProfile.find({ id: { $in: merchantIds } }, 'id business_name')
    ]);

    const orderMap = new Map(orders.map(o => [o.id, o]));
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const enriched = settlements.map(s => {
      const sObj = s.toObject();
      sObj.order_number = orderMap.get(s.order_id)?.order_number || `Order #${s.order_id}`;
      sObj.business_name = profileMap.get(s.merchant_id)?.business_name || `Merchant #${s.merchant_id}`;
      return sObj;
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

// List merchant wallets (Admin)
router.get('/wallets', requireAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');
    const MerchantProfile = require('../models/MerchantProfile');

    const wallets = await Wallet.find({});
    const merchantIds = wallets.map(w => w.merchant_id);

    const profiles = await MerchantProfile.find({ id: { $in: merchantIds } }, 'id business_name');
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const enriched = wallets.map(w => {
      const wObj = w.toObject();
      wObj.business_name = profileMap.get(w.merchant_id)?.business_name || `Merchant #${w.merchant_id}`;
      return wObj;
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// List Return Requests (Admin RMA Console)
router.get('/return-requests', requireAdminOrSupport, async (req, res, next) => {
  try {
    const ReturnRequest = require('../models/ReturnRequest');
    const User = require('../models/User');
    const Order = require('../models/Order');
    const MerchantProfile = require('../models/MerchantProfile');

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.page_size) || 10;
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await ReturnRequest.countDocuments(filter);
    const requests = await ReturnRequest.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    const enriched = await Promise.all(requests.map(async (r) => {
      const rObj = r.toObject();
      const [customer, order, merchant] = await Promise.all([
        User.findOne({ id: r.customer_id }, 'id full_name email'),
        Order.findOne({ id: r.order_id }, 'id order_number status total_amount'),
        MerchantProfile.findOne({ id: r.merchant_id }, 'id business_name')
      ]);

      rObj.customer = customer;
      rObj.order = order;
      rObj.merchant = merchant;
      return rObj;
    }));

    res.json({
      items: enriched,
      total,
      page,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Approve or Reject RMA Return Request
router.patch('/return-requests/:id/approval', requireAdminOrSupport, async (req, res, next) => {
  try {
    const ReturnRequest = require('../models/ReturnRequest');
    const Order = require('../models/Order');
    const AuditLog = require('../models/AuditLog');

    const requestId = Number(req.params.id);
    const { status, admin_notes } = req.body;

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ detail: 'Status must be approved or rejected' });
    }

    const request = await ReturnRequest.findOne({ id: requestId });
    if (!request) {
      return res.status(404).json({ detail: 'Return request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ detail: 'Request has already been processed' });
    }

    request.status = status;
    if (admin_notes !== undefined) {
      request.admin_notes = admin_notes;
    }
    await request.save();

    const order = await Order.findOne({ id: request.order_id });
    if (order) {
      order.status = status === 'approved' ? 'return_approved' : 'delivered';
      
      const history = order.status_history || [];
      history.push({
        status: order.status,
        timestamp: new Date().toISOString(),
        note: `RMA return request ${status} by admin. Notes: ${admin_notes || 'None'}`,
        updated_by: req.user.id
      });
      order.status_history = history;
      order.markModified('status_history');
      await order.save();
    }

    const audit = new AuditLog({
      action_type: `rma_return_${status}`,
      actor_id: req.user.id,
      actor_email: req.user.email,
      target_id: request.id,
      target_type: 'ReturnRequest',
      details: `RMA Return Request #${request.id} for Order #${order?.order_number || request.order_id} was ${status} by admin.`,
      timestamp: new Date()
    });
    await audit.save();

    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Complete Return & Issue Refund (Finalize RMA)
router.post('/return-requests/:id/complete', requireAdminOrSupport, async (req, res, next) => {
  try {
    const ReturnRequest = require('../models/ReturnRequest');
    const Order = require('../models/Order');
    const OrderItem = require('../models/OrderItem');
    const Product = require('../models/Product');
    const Settlement = require('../models/Settlement');
    const Wallet = require('../models/Wallet');
    const AuditLog = require('../models/AuditLog');

    const requestId = Number(req.params.id);
    const request = await ReturnRequest.findOne({ id: requestId });
    if (!request) {
      return res.status(404).json({ detail: 'Return request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ detail: 'Only approved returns can be completed' });
    }

    request.status = 'completed';
    await request.save();

    const order = await Order.findOne({ id: request.order_id });
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    order.status = 'refunded';
    order.payment_status = 'refunded';
    
    const history = order.status_history || [];
    history.push({
      status: 'refunded',
      timestamp: new Date().toISOString(),
      note: 'RMA Return Completed. Payout refunded to buyer.',
      updated_by: req.user.id
    });
    order.status_history = history;
    order.markModified('status_history');
    await order.save();

    const orderItems = await OrderItem.find({ order_id: order.id });
    for (const item of orderItems) {
      await Product.updateOne(
        { id: item.product_id },
        {
          $inc: {
            stock_quantity: item.quantity,
            total_sold: -item.quantity
          }
        }
      );
    }

    const settlements = await Settlement.find({ order_id: order.id });
    for (const settlement of settlements) {
      if (settlement.status === 'refunded') continue;

      const originalStatus = settlement.status;
      settlement.status = 'refunded';
      await settlement.save();

      let wallet = await Wallet.findOne({ merchant_id: settlement.merchant_id });
      if (wallet) {
        if (originalStatus === 'escrow_hold') {
          wallet.pending_balance = Number(Math.max(0, (wallet.pending_balance || 0) - settlement.amount).toFixed(2));
        } else if (originalStatus === 'released') {
          wallet.available_balance = Number(((wallet.available_balance || 0) - settlement.amount).toFixed(2));
        }
        await wallet.save();
      }
      console.log(`[RMA Refund] Reverted ₹${settlement.amount} from Merchant Profile #${settlement.merchant_id} due to customer return.`);
    }

    const audit = new AuditLog({
      action_type: 'rma_return_completed',
      actor_id: req.user.id,
      actor_email: req.user.email,
      target_id: request.id,
      target_type: 'ReturnRequest',
      details: `RMA Return request #${request.id} finalized. Order #${order.order_number} refunded. Inventory stock replenished.`,
      timestamp: new Date()
    });
    await audit.save();

    res.json({ detail: 'Return completed and refund processed successfully', request });
  } catch (error) {
    next(error);
  }
});

// ─── PERMANENT DELETE API ENDPOINTS FOR ADMIN FEATURES ────────────────────────

// Delete User
router.delete('/users/:user_id', requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    if (user.role === 'admin' && user.id === req.user.id) {
      return res.status(400).json({ detail: 'Cannot delete your own admin account' });
    }

    await User.deleteOne({ id: userId });
    res.json({ detail: `User #${userId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Merchant Profile
router.delete('/merchants/:merchant_id', requireAdmin, async (req, res, next) => {
  try {
    const merchantId = Number(req.params.merchant_id);
    const profile = await MerchantProfile.findOne({ id: merchantId });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    await MerchantProfile.deleteOne({ id: merchantId });
    if (profile.user_id) {
      await User.deleteOne({ id: profile.user_id });
    }
    res.json({ detail: `Merchant profile #${merchantId} and user account deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Product
router.delete('/products/:product_id', requireAdmin, async (req, res, next) => {
  try {
    const productId = Number(req.params.product_id);
    const Product = require('../models/Product');
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    await Product.deleteOne({ id: productId });
    res.json({ detail: `Product #${productId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Coupon (Permanent Database Deletion)
router.delete('/coupons/:coupon_id', requireAdmin, async (req, res, next) => {
  try {
    const couponId = Number(req.params.coupon_id);
    const coupon = await Coupon.findOne({ id: couponId });
    if (!coupon) {
      return res.status(404).json({ detail: 'Coupon not found' });
    }

    await Coupon.deleteOne({ id: couponId });
    res.json({ detail: `Coupon #${couponId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Order
router.delete('/orders/:order_id', requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    await Order.deleteOne({ id: orderId });
    await OrderItem.deleteMany({ order_id: orderId });
    res.json({ detail: `Order #${orderId} and items permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Return Request
router.delete('/return-requests/:request_id', requireAdmin, async (req, res, next) => {
  try {
    const requestId = Number(req.params.request_id);
    const ReturnRequest = require('../models/ReturnRequest');
    const request = await ReturnRequest.findOne({ id: requestId });
    if (!request) {
      return res.status(404).json({ detail: 'Return request not found' });
    }

    await ReturnRequest.deleteOne({ id: requestId });
    res.json({ detail: `Return request #${requestId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Withdrawal Request
router.delete('/withdrawals/:request_id', requireAdmin, async (req, res, next) => {
  try {
    const requestId = Number(req.params.request_id);
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const request = await WithdrawalRequest.findOne({ id: requestId });
    if (!request) {
      return res.status(404).json({ detail: 'Withdrawal request not found' });
    }

    await WithdrawalRequest.deleteOne({ id: requestId });
    res.json({ detail: `Withdrawal request #${requestId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Settlement
router.delete('/settlements/:settlement_id', requireAdmin, async (req, res, next) => {
  try {
    const settlementId = Number(req.params.settlement_id);
    const Settlement = require('../models/Settlement');
    const settlement = await Settlement.findOne({ id: settlementId });
    if (!settlement) {
      return res.status(404).json({ detail: 'Settlement not found' });
    }

    await Settlement.deleteOne({ id: settlementId });
    res.json({ detail: `Settlement record #${settlementId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

// Delete Commission
router.delete('/commissions/:commission_id', requireAdmin, async (req, res, next) => {
  try {
    const commissionId = Number(req.params.commission_id);
    const commission = await Commission.findOne({ id: commissionId });
    if (!commission) {
      return res.status(404).json({ detail: 'Commission not found' });
    }

    await Commission.deleteOne({ id: commissionId });
    res.json({ detail: `Commission record #${commissionId} permanently deleted from database` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
