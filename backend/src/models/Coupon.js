const mongoose = require('mongoose');
const Counter = require('./Counter');

const CouponSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  description: { type: String, default: null },
  discount_type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  discount_value: { type: Number, default: 0 }, // percentage e.g. 15 or fixed amount e.g. 200
  discount_amount: { type: Number, required: true }, // e.g. 200 (fallback or computed value)
  max_discount_amount: { type: Number, default: null }, // Optional cap for percentage coupons e.g. 1000
  promoter_commission: { type: Number, required: true }, // e.g. 100
  platform_profit: { type: Number, required: true }, // e.g. 100
  promoter_id: { type: Number, ref: 'User', default: null, index: true },
  min_order_amount: { type: Number, default: 0.0 },
  max_uses: { type: Number, default: null },
  used_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  valid_from: { type: Date, default: Date.now },
  valid_until: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  created_by: { type: Number, ref: 'User', default: null }
});

// Auto-increment sequence hook
CouponSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'couponId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;
