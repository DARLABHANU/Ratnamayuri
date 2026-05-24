const mongoose = require('mongoose');
const Counter = require('./Counter');

const MerchantProfileSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, unique: true, ref: 'User', index: true },
  business_name: { type: String, required: true },
  business_description: { type: String, default: null },
  gstin: { type: String, default: null },
  bank_account: { type: String, default: null },
  ifsc_code: { type: String, default: null },
  commission_rate: { type: Number, default: 10.0 }, // platform fee %
  is_approved: { type: Boolean, default: false },
  logo_url: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

// Auto-increment sequence hook
MerchantProfileSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'merchantProfileId',
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

const MerchantProfile = mongoose.model('MerchantProfile', MerchantProfileSchema);

module.exports = MerchantProfile;
