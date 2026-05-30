const mongoose = require('mongoose');
const Counter = require('./Counter');

const SettlementSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_id: { type: Number, required: true, ref: 'Order', index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  amount: { type: Number, required: true }, // net merchant share
  platform_commission: { type: Number, required: true }, // platform commission cut
  status: {
    type: String,
    enum: ['escrow_hold', 'released', 'disputed', 'refunded'],
    default: 'escrow_hold',
    index: true
  },
  release_date: { type: Date, required: true, index: true }, // 7 days after delivery
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
