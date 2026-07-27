const mongoose = require('mongoose');
const Counter = require('./Counter');

const ProductSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  category_id: { type: Number, ref: 'Category', default: null, index: true },
  subcategory: { type: String, default: null, index: true },
  subcategory_slug: { type: String, default: null, index: true },
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
  const PLATFORM_MARGIN = 299;

  // If seller sets base_price, customer selling price = base_price + 299
  // If seller passes price directly without base_price, compute base_price = price - 299
  if (this.base_price !== undefined && this.base_price !== null) {
    this.price = Math.round((Number(this.base_price) + PLATFORM_MARGIN) * 100) / 100;
  } else if (this.price !== undefined && this.price !== null) {
    this.base_price = Math.max(0, Math.round((Number(this.price) - PLATFORM_MARGIN) * 100) / 100);
    this.price = Math.round(Number(this.price) * 100) / 100;
  } else {
    this.base_price = 1700;
    this.price = 1999;
  }

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
