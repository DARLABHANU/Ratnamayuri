const mongoose = require('mongoose');
const Counter = require('./Counter');

const ReviewSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  product_id: { type: Number, required: true, index: true },
  user_id: { type: Number, required: true, ref: 'User', index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
ReviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'reviewId',
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

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
