const mongoose = require('mongoose');
const Counter = require('./Counter');

const WithdrawalRequestSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  bank_name: { type: String, default: null },
  account_number: { type: String, default: null },
  routing_details: { type: String, default: null }, // IFSC, routing code, etc.
  processed_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
WithdrawalRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'withdrawalRequestId',
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

const WithdrawalRequest = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);

module.exports = WithdrawalRequest;
