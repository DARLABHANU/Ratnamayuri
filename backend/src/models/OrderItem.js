const mongoose = require('mongoose');
const Counter = require('./Counter');

const OrderItemSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_id: { type: Number, required: true, ref: 'Order', index: true },
  product_id: { type: Number, required: true, ref: 'Product' },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  product_name: { type: String, required: true },
  product_image: { type: String, default: null },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_price: { type: Number, required: true },
  merchant_payout: { type: Number, default: 0.0 },
  platform_fee: { type: Number, default: 0.0 }
});

// Auto-increment sequence hook
OrderItemSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'orderItemId',
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

const OrderItem = mongoose.model('OrderItem', OrderItemSchema);

module.exports = OrderItem;
