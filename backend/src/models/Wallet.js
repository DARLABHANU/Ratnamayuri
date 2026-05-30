const mongoose = require('mongoose');
const Counter = require('./Counter');

const WalletSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  merchant_id: { type: Number, required: true, unique: true, ref: 'MerchantProfile', index: true },
  available_balance: { type: Number, default: 0.0 },
  pending_balance: { type: Number, default: 0.0 },
  withdrawn_balance: { type: Number, default: 0.0 },
  currency: { type: String, default: 'INR' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
WalletSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'walletId',
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

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
