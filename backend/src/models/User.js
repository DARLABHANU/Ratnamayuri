const mongoose = require('mongoose');
const Counter = require('./Counter');

const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  hashed_password: { type: String, required: true },
  full_name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['customer', 'merchant', 'admin', 'support'], default: 'customer' },
  account_number: { type: String, unique: true, index: true },
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  is_first_login: { type: Boolean, default: true },
  avatar_url: { type: String, default: null },
  payout_bank_name: { type: String, default: null },
  payout_account_number: { type: String, default: null },
  payout_ifsc_code: { type: String, default: null },
  payout_account_holder_name: { type: String, default: null },
  payout_upi_id: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index
UserSchema.index({ email: 1, role: 1 });

// Auto-increment sequence hook
UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'userId',
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

const User = mongoose.model('User', UserSchema);

module.exports = User;
