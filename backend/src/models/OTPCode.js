const mongoose = require('mongoose');
const Counter = require('./Counter');

const OTPCodeSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, ref: 'User', index: true },
  code: { type: String, required: true },
  purpose: { type: String, default: 'email_verification' }, // email_verification, password_reset
  is_used: { type: Boolean, default: false },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

// Auto-increment sequence hook
OTPCodeSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'otpCodeId',
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

const OTPCode = mongoose.model('OTPCode', OTPCodeSchema);

module.exports = OTPCode;
