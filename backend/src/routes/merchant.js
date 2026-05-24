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

    Object.assign(profile, req.body);
    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get order IDs from delivered orders in the last 'days'
    const orders = await Order.find({
      status: 'delivered',
      created_at: { $gte: since }
    });
    const orderIds = orders.map(o => o.id);

    // Get matching order items for this merchant
    const orderItems = await OrderItem.find({
      merchant_id: profile.id,
      order_id: { $in: orderIds }
    });

    // Total revenue (total sum of total_price)
    const total_revenue = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    // Total unique orders
    const total_orders = new Set(orderItems.map(item => item.order_id)).size;

    // Total products listed
    const total_products = await Product.countDocuments({ merchant_id: profile.id });

    // Top products by revenue
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

    // Pending payout: total sum of merchant_payout from ALL delivered orders
    const allDeliveredOrders = await Order.find({ status: 'delivered' });
    const allDeliveredOrderIds = allDeliveredOrders.map(o => o.id);
    const allDeliveredItems = await OrderItem.find({
      merchant_id: profile.id,
      order_id: { $in: allDeliveredOrderIds }
    });

    const pending_payout = allDeliveredItems.reduce((sum, item) => sum + item.merchant_payout, 0);

    res.json({
      total_revenue,
      total_orders,
      total_products,
      top_products,
      pending_payout,
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

module.exports = router;
