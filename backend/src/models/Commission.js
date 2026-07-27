const mongoose = require('mongoose');
const Counter = require('./Counter');

const CommissionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_id: { type: Number, required: true, ref: 'Order', index: true },
  coupon_id: { type: Number, required: true, ref: 'Coupon' },
  promoter_id: { type: Number, required: true, ref: 'User', index: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  utr_number: { type: String, default: null },
  payment_method: { type: String, default: null },
  admin_notes: { type: String, default: null },
  notes: { type: String, default: null },
  paid_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

// Auto-increment sequence hook
CommissionSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'commissionId',
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

const Commission = mongoose.model('Commission', CommissionSchema);

module.exports = Commission;
