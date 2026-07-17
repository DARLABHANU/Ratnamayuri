const express = require('express');
const MerchantProfile = require('../models/MerchantProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Commission = require('../models/Commission');
const { getCurrentUser, requireMerchantOrAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── Profile Management ──────────────────────────────────────────────────────

// Create Profile
router.post('/profile', getCurrentUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ detail: 'Only merchants can create profiles' });
    }

    const existing = await MerchantProfile.findOne({ user_id: req.user.id });
    if (existing) {
      return res.status(409).json({ detail: 'Merchant profile already exists' });
    }

    const profile = new MerchantProfile({
      user_id: req.user.id,
      ...req.body,
      is_approved: req.user.is_verified // Automatically approve if the admin already verified this user
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
});

// Get Profile
router.get('/profile', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Update Profile
router.put('/profile', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    // Whitelist allowed fields to prevent mass assignment attacks
    const allowedFields = ['business_name', 'business_description', 'gstin', 'bank_account', 'ifsc_code', 'logo_url'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });
    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');

    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get order IDs from delivered orders in the selected period
    const orders = await Order.find({
      status: 'delivered',
      created_at: { $gte: since }
    });
    const orderIds = orders.map(o => o.id);

    // Get matching order items for this merchant in the period
    const orderItems = await OrderItem.find({
      merchant_id: profile.id,
      order_id: { $in: orderIds }
    });

    // Total revenue from the period
    const total_revenue = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    // Total unique orders in the period
    const total_orders = new Set(orderItems.map(item => item.order_id)).size;

    // Total products listed
    const total_products = await Product.countDocuments({ merchant_id: profile.id });

    // Top products by revenue in the period
    const productSales = {};
    orderItems.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, revenue: 0, units_sold: 0 };
      }
      productSales[item.product_name].revenue += item.total_price;
      productSales[item.product_name].units_sold += item.quantity;
    });

    const top_products = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ─── Wallet balances (source of truth for payouts) ─────────────────────
    // Read directly from Wallet model — this correctly reflects escrow releases
    // done by the SLA scheduler, rather than recalculating from raw OrderItems.
    let wallet = await Wallet.findOne({ merchant_id: profile.id });
    if (!wallet) {
      wallet = new Wallet({ merchant_id: profile.id });
      await wallet.save();
    }

    const pending_payout   = wallet.pending_balance   || 0; // In escrow (7-day hold)
    const available_payout = wallet.available_balance || 0; // Released, ready to withdraw
    const withdrawn_payout = wallet.withdrawn_balance || 0; // Already requested/paid out

    const productsList = await Product.find({ merchant_id: profile.id, is_active: true });
    const low_stock_products = productsList
      .filter(p => p.stock_quantity <= (p.low_stock_threshold || 5))
      .map(p => ({
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold || 5
      }));

    res.json({
      total_revenue,
      total_orders,
      total_products,
      top_products,
      pending_payout,
      available_payout,
      withdrawn_payout,
      low_stock_products,
      period_days: days
    });
  } catch (error) {
    next(error);
  }
});

// Promoter Commissions
router.get('/commissions', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const commissions = await Commission.find({ promoter_id: req.user.id })
      .sort({ created_at: -1 });
    res.json(commissions);
  } catch (error) {
    next(error);
  }
});

// ─── Wallet & Withdrawals ───────────────────────────────────────────────────

// Get Merchant Wallet
router.get('/wallet', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    let wallet = await Wallet.findOne({ merchant_id: profile.id });
    if (!wallet) {
      wallet = new Wallet({ merchant_id: profile.id });
      await wallet.save();
    }
    res.json(wallet);
  } catch (error) {
    next(error);
  }
});

// Request Withdrawal
router.post('/withdraw', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const { amount, bank_name, account_number, routing_details } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ detail: 'Invalid withdrawal amount specified' });
    }

    let wallet = await Wallet.findOne({ merchant_id: profile.id });
    if (!wallet || wallet.available_balance < amount) {
      return res.status(400).json({ detail: 'Insufficient available balance' });
    }

    // Deduct available balance and place it into withdrawn/reserved state
    wallet.available_balance = Number((wallet.available_balance - amount).toFixed(2));
    wallet.withdrawn_balance = Number(((wallet.withdrawn_balance || 0) + amount).toFixed(2));
    await wallet.save();

    // Create withdrawal request
    const request = new WithdrawalRequest({
      merchant_id: profile.id,
      amount,
      bank_name,
      account_number,
      routing_details,
      status: 'pending'
    });
    await request.save();

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Withdrawal Requests
router.get('/withdrawals', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.page_size) || 10;
    const skip = (page - 1) * pageSize;

    const filter = { merchant_id: profile.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await WithdrawalRequest.countDocuments(filter);
    const items = await WithdrawalRequest.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Escrow Settlements
router.get('/settlements', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Settlement = require('../models/Settlement');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.page_size) || 10;
    const skip = (page - 1) * pageSize;

    const filter = { merchant_id: profile.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Settlement.countDocuments(filter);
    const items = await Settlement.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    const Order = require('../models/Order');
    const enriched = await Promise.all(items.map(async (item) => {
      const plain = item.toObject();
      const order = await Order.findOne({ id: item.order_id });
      plain.order_number = order ? order.order_number : `Order #${item.order_id}`;
      return plain;
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

module.exports = router;
