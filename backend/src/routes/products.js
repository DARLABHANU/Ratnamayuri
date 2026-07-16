const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const MerchantProfile = require('../models/MerchantProfile');
const Review = require('../models/Review');
const User = require('../models/User');
const { getCurrentUser, requireMerchantOrAdmin } = require('../middleware/auth');
const { slugify } = require('../utils/helpers');

const router = express.Router();

// Helper to get merchant profile
const getMerchantProfile = async (userId) => {
  const profile = await MerchantProfile.findOne({ user_id: userId });
  if (!profile) {
    const error = new Error('You must create your merchant profile before performing this action.');
    error.status = 400;
    throw error;
  }
  return profile;
};

// Helper to attach Category to Product
const attachCategories = async (products) => {
  const isArray = Array.isArray(products);
  const items = isArray ? products : [products];

  const categoryIds = [...new Set(items.map(p => p.category_id).filter(id => id !== null))];
  const categories = await Category.find({ id: { $in: categoryIds } });
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const enriched = items.map(p => {
    const pObj = p.toObject();
    pObj.category = pObj.category_id ? categoryMap.get(pObj.category_id) || null : null;
    return pObj;
  });

  return isArray ? enriched : enriched[0];
};

// ─── Public Endpoints ─────────────────────────────────────────────────────────

// List products
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const category_id = req.query.category_id ? Number(req.query.category_id) : null;
    const categorySlug = req.query.category || null;
    const search = req.query.search || null;
    const min_price = req.query.min_price !== undefined ? Number(req.query.min_price) : null;
    const max_price = req.query.max_price !== undefined ? Number(req.query.max_price) : null;
    const is_featured = req.query.is_featured !== undefined ? req.query.is_featured === 'true' : null;

    const sortBy = req.query.sort_by || 'created_at';
    const sortOrder = req.query.sort_order || 'desc';

    const filter = { is_active: true, is_approved: true };

    if (category_id !== null) {
      filter.category_id = category_id;
    } else if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug });
      if (categoryDoc) {
        filter.category_id = categoryDoc.id;
      } else {
        filter.category_id = -999; // Return empty set if category not found
      }
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    if (min_price !== null || max_price !== null) {
      filter.price = {};
      if (min_price !== null) filter.price.$gte = min_price;
      if (max_price !== null) filter.price.$lte = max_price;
    }

    if (is_featured !== null) {
      filter.is_featured = is_featured;
    }

    // Debug logging
    const fs = require('fs');
    const logMsg = `[${new Date().toISOString()}] req.query: ${JSON.stringify(req.query)} | filter: ${JSON.stringify(filter)}\n`;
    fs.appendFileSync(require('path').join(__dirname, '../../query_debug.log'), logMsg);

    const total = await Product.countDocuments(filter);

    // Sorting
    const allowedSortFields = ['price', 'created_at', 'rating_avg', 'total_sold'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

    const offset = (page - 1) * pageSize;
    const products = await Product.find(filter)
      .sort(sort)
      .skip(offset)
      .limit(pageSize);

    const enrichedProducts = await attachCategories(products);

    res.json({
      items: enrichedProducts,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// List all categories (public)
router.get('/categories/all', async (req, res, next) => {
  try {
    const categories = await Category.find({ is_active: true }).sort({ sort_order: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Get single product
router.get('/:product_id', async (req, res, next) => {
  try {
    const productId = Number(req.params.product_id);
    const product = await Product.findOne({ id: productId, is_active: true, is_approved: true });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    const enriched = await attachCategories(product);
    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// ─── Merchant / Admin Endpoints ───────────────────────────────────────────────

// Get merchant's own products
router.get('/merchant/my-products', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));

    const merchant = await getMerchantProfile(req.user.id);
    const filter = { merchant_id: merchant.id };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const enriched = await attachCategories(products);

    res.json({
      items: enriched,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Create product
router.post('/', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const payload = req.body;
    let merchantId;

    if (req.user.role === 'merchant') {
      const merchant = await getMerchantProfile(req.user.id);
      if (!merchant.is_approved) {
        return res.status(403).json({ detail: 'Merchant account not yet approved' });
      }
      merchantId = merchant.id;
    } else {
      return res.status(400).json({ detail: 'Admin should specify merchant_id via admin route' });
    }

    // Normalize SKU to null if empty string or blank to prevent index collisions
    if (payload.sku !== undefined) {
      if (typeof payload.sku === 'string' && !payload.sku.trim()) {
        payload.sku = null;
      }
    }

    let slug = slugify(payload.name);
    const baseSlug = slug;
    let counter = 1;

    while (true) {
      const existingSlug = await Product.findOne({ slug });
      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = new Product({
      merchant_id: merchantId,
      slug,
      ...payload
    });

    await product.save();
    const enriched = await attachCategories(product);

    res.status(201).json(enriched);
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:product_id', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const productId = Number(req.params.product_id);
    const payload = req.body;

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    // Merchant can only edit their own products
    if (req.user.role === 'merchant') {
      const merchant = await getMerchantProfile(req.user.id);
      if (product.merchant_id !== merchant.id) {
        return res.status(403).json({ detail: 'Not your product' });
      }
    }

    // Normalize SKU to null if empty string or blank to prevent index collisions
    if (payload.sku !== undefined) {
      if (typeof payload.sku === 'string' && !payload.sku.trim()) {
        payload.sku = null;
      }
    }

    Object.assign(product, payload);
    await product.save();
    const enriched = await attachCategories(product);

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// Hard delete product
router.delete('/:product_id', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const productId = Number(req.params.product_id);
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    // Merchant can only delete their own products
    if (req.user.role === 'merchant') {
      const merchant = await getMerchantProfile(req.user.id);
      if (product.merchant_id !== merchant.id) {
        return res.status(403).json({ detail: 'Not your product' });
      }
    }

    // Delete from database
    await Product.deleteOne({ id: productId });

    // Also clean up from any customer shopping carts to prevent rendering breaks
    const CartItem = require('../models/CartItem');
    await CartItem.deleteMany({ product_id: productId });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// ─── Product Reviews Endpoints ───────────────────────────────────────────────

// Get reviews for a product
router.get('/:product_id/reviews', async (req, res, next) => {
  try {
    const productId = Number(req.params.product_id);
    const reviews = await Review.find({ product_id: productId })
      .sort({ created_at: -1 });

    // Manually fetch user details using numeric user IDs to avoid Mongoose populate ObjectId CastError
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(id => id !== null && id !== undefined))];
    const users = await User.find({ id: { $in: userIds } }, 'id full_name avatar_url');
    const userMap = new Map(users.map(u => [u.id, u]));

    // Format for frontend response
    const formatted = reviews.map(r => {
      const rObj = r.toObject();
      const user = userMap.get(rObj.user_id);
      return {
        id: rObj.id,
        product_id: rObj.product_id,
        rating: rObj.rating,
        comment: rObj.comment,
        images: rObj.images || [],
        created_at: rObj.created_at,
        reviewer_name: user ? user.full_name : 'Valued Customer',
        reviewer_avatar: user ? user.avatar_url : null
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// Add a review to a product
router.post('/:product_id/reviews', getCurrentUser, async (req, res, next) => {
  try {
    const productId = Number(req.params.product_id);
    const { rating, comment, images } = req.body;

    const product = await Product.findOne({ id: productId, is_active: true });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ detail: 'Rating must be between 1 and 5 stars' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ detail: 'Review comment cannot be empty' });
    }

    const review = new Review({
      product_id: productId,
      user_id: req.user.id,
      rating: Number(rating),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : []
    });

    await review.save();

    // Recalculate average rating & rating count on the product
    const allReviews = await Review.find({ product_id: productId });
    const count = allReviews.length;
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

    product.rating_count = count;
    product.rating_avg = Math.round(avg * 10) / 10;
    await product.save();

    // Return the newly created review with user info attached
    const enrichedReview = {
      id: review.id,
      product_id: review.product_id,
      rating: review.rating,
      comment: review.comment,
      images: review.images,
      created_at: review.created_at,
      reviewer_name: req.user.full_name,
      reviewer_avatar: req.user.avatar_url
    };

    res.status(201).json(enrichedReview);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
