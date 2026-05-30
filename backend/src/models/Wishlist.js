const mongoose = require('mongoose');
const Counter = require('./Counter');

const WishlistSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, unique: true, ref: 'User', index: true },
  product_ids: { type: [Number], default: [] }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
WishlistSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'wishlistId',
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

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist;
