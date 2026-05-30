const express = require('express');
const router = express.Router();
const { getCurrentUser } = require('../middleware/auth');
const Commission = require('../models/Commission');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// 1. Get Promoter Commissions
router.get('/commissions', getCurrentUser, async (req, res, next) => {
  try {
    const commissions = await Commission.find({ promoter_id: req.user.id })
      .sort({ created_at: -1 });
    res.json(commissions);
  } catch (error) {
    next(error);
  }
});

// 2. Get Promoter Coupons
router.get('/coupons', getCurrentUser, async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ promoter_id: req.user.id, is_active: true })
      .sort({ created_at: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
});

// 3. Get Promoter Analytics
router.get('/analytics', getCurrentUser, async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ promoter_id: req.user.id });
    const couponIds = coupons.map(c => c.id);

    // Commissions breakdown
    const commissions = await Commission.find({ promoter_id: req.user.id });
    const pending_commissions = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
    const paid_commissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
    const total_commissions = pending_commissions + paid_commissions;

    // Referred sales from Orders
    const referredOrders = await Order.find({ coupon_id: { $in: couponIds }, payment_status: 'paid' });
    const total_referred_sales = referredOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const total_referred_orders = referredOrders.length;

    res.json({
      total_referred_sales,
      total_referred_orders,
      pending_commissions,
      paid_commissions,
      total_commissions,
      coupon_count: coupons.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
