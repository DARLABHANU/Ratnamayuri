const mongoose = require('mongoose');
const Counter = require('./Counter');

const ReturnRequestSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_id: { type: Number, required: true, ref: 'Order', index: true },
  customer_id: { type: Number, required: true, ref: 'User', index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  reason: { type: String, required: true },
  proof_image_url: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  admin_notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
ReturnRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'returnRequestId',
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

const ReturnRequest = mongoose.model('ReturnRequest', ReturnRequestSchema);

module.exports = ReturnRequest;
