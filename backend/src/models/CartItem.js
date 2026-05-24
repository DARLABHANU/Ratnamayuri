const mongoose = require('mongoose');
const Counter = require('./Counter');

const CartItemSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, ref: 'User', index: true },
  product_id: { type: Number, required: true, ref: 'Product', index: true },
  quantity: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound unique index for user and product combination
CartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Auto-increment sequence hook
CartItemSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'cartItemId',
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

const CartItem = mongoose.model('CartItem', CartItemSchema);

module.exports = CartItem;
