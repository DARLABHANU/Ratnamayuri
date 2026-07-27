const mongoose = require('mongoose');
const Counter = require('./Counter');

const SettlementSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_id: { type: Number, required: true, ref: 'Order', index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  amount: { type: Number, required: true }, // net merchant share (seller price)
  platform_commission: { type: Number, default: 299 }, // platform commission cut
  status: {
    type: String,
    enum: ['pending', 'escrow_hold', 'released', 'paid', 'disputed', 'refunded'],
    default: 'pending',
    index: true
  },
  utr_number: { type: String, default: null }, // Offline bank/UPI transaction ref / UTR
  payment_method: { type: String, default: null }, // UPI, NEFT, IMPS, GPay, PhonePe
  admin_notes: { type: String, default: null },
  release_date: { type: Date, default: Date.now, index: true },
  paid_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
SettlementSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'settlementId',
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

const Settlement = mongoose.model('Settlement', SettlementSchema);

module.exports = Settlement;
