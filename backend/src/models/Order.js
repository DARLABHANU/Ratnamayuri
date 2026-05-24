const mongoose = require('mongoose');
const Counter = require('./Counter');

const OrderSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_number: { type: String, required: true, unique: true, index: true },
  customer_id: { type: Number, required: true, ref: 'User', index: true },
  address_id: { type: Number, ref: 'Address', default: null },
  coupon_id: { type: Number, ref: 'Coupon', default: null },
  subtotal: { type: Number, required: true },
  discount_amount: { type: Number, default: 0.0 },
  shipping_amount: { type: Number, default: 0.0 },
  tax_amount: { type: Number, default: 0.0 },
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_method: { type: String, default: null },
  payment_reference: { type: String, default: null },
  tracking_number: { type: String, default: null },
  notes: { type: String, default: null },
  status_history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  delivered_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'orderId',
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

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
