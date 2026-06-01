const mongoose = require('mongoose');
const Counter = require('./Counter');

const ProductSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  category_id: { type: Number, ref: 'Category', default: null, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  short_description: { type: String, default: null },
  price: { type: Number, required: true },
  base_price: { type: Number, default: null },
  compare_price: { type: Number, default: null },
  cost_price: { type: Number, default: null },
  sku: { type: String, unique: true, sparse: true, default: null },
  stock_quantity: { type: Number, default: 0 },
  low_stock_threshold: { type: Number, default: 5 },
  weight_grams: { type: Number, default: null },
  images: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true, index: true },
  is_approved: { type: Boolean, default: false, index: true },
  is_featured: { type: Boolean, default: false },
  rating_avg: { type: Number, default: 0.0 },
  rating_count: { type: Number, default: 0 },
  total_sold: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook and dynamic customer price calculation
ProductSchema.pre('save', async function (next) {
  if (this.isModified('price') && !this.isModified('base_price')) {
    this.base_price = this.price;
  }

  // If base_price is not set (e.g. initial seed files), default it to price
  if (this.base_price === undefined || this.base_price === null) {
    this.base_price = this.price;
  }

  // Calculate final customer price: base_price + promoter_cut + admin_cut
  // If base_price < 1000: promoter = 5% of base_price, admin = 5% of base_price (total 10% markup)
  // If base_price >= 1000: promoter = 10% of base_price, admin = 10% of base_price (total 20% markup)
  const pct = this.base_price < 1000 ? 0.05 : 0.10;
  this.price = Math.round(this.base_price * (1 + 2 * pct) * 100) / 100;

  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'productId',
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

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
