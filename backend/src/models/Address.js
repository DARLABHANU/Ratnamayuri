const mongoose = require('mongoose');
const Counter = require('./Counter');

const AddressSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, ref: 'User', index: true },
  label: { type: String, default: 'Home' },
  full_name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Auto-increment sequence hook
AddressSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'addressId',
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

const Address = mongoose.model('Address', AddressSchema);

module.exports = Address;
