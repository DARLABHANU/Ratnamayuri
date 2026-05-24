const mongoose = require('mongoose');
const Counter = require('./Counter');

const CategorySchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  image_url: { type: String, default: null },
  parent_id: { type: Number, default: null, ref: 'Category' },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 }
});

// Auto-increment sequence hook
CategorySchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'categoryId',
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

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
