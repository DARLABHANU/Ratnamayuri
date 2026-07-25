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

// Helper to attach Category & Merchant details to Product
const attachCategories = async (products) => {
  const isArray = Array.isArray(products);
  const items = isArray ? products : [products];

  const categoryIds = [...new Set(items.map(p => p.category_id).filter(id => id !== null))];
  const merchantIds = [...new Set(items.map(p => p.merchant_id).filter(id => id !== null))];

  const [categories, merchants] = await Promise.all([
    Category.find({ id: { $in: categoryIds } }),
    MerchantProfile.find({ id: { $in: merchantIds } })
  ]);

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const merchantMap = new Map(merchants.map(m => [m.id, m]));

  const enriched = items.map(p => {
    const pObj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
    pObj.category = pObj.category_id ? categoryMap.get(pObj.category_id) || null : null;

    // Attach exact merchant profile details based on who added the respective product
    const merch = pObj.merchant_id ? merchantMap.get(pObj.merchant_id) || null : null;
    pObj.merchant = merch ? {
      id: merch.id,
      business_name: merch.business_name || 'RATNAMAYURI BOUTIQUE OFFICIAL',
      business_description: merch.business_description || 'Certified Luxury Weavers & Artisans',
      gstin: merch.gstin || null,
      logo_url: merch.logo_url || null,
      is_approved: merch.is_approved
    } : {
      id: pObj.merchant_id || 1,
      business_name: 'RATNAMAYURI BOUTIQUE OFFICIAL',
      business_description: 'Certified Luxury Weavers & Artisans',
      gstin: null,
      logo_url: null,
      is_approved: true
    };

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

    const subcategory = req.query.subcategory || null;
    const subcategorySlug = req.query.subcategory_slug || null;
    const fabric = req.query.fabric || null;
    const tag = req.query.tag || null;
    const min_rating = req.query.min_rating !== undefined ? Number(req.query.min_rating) : null;

    const filter = { is_active: true, is_approved: true };

    if (category_id !== null) {
      filter.category_id = category_id;
    } else if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug.toLowerCase() });
      if (categoryDoc) {
        filter.category_id = categoryDoc.id;
      } else {
        filter.category_id = -999; // Return empty set if category not found
      }
    }

    // Subcategory Filter (Exact or regex match on subcategory/tags)
    const targetSub = subcategory || subcategorySlug;
    if (targetSub) {
      const escapedSub = targetSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const subRegex = new RegExp(`^${escapedSub}$|\\b${escapedSub}\\b`, 'i');
      filter.$or = [
        { subcategory: subRegex },
        { subcategory_slug: targetSub.toLowerCase().replace(/\s+/g, '-') },
        { tags: subRegex },
        { name: subRegex }
      ];
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(`\\b${escapedSearch}\\b|${escapedSearch}`, 'i');
      const searchCond = [
        { name: searchRegex },
        { subcategory: searchRegex },
        { tags: searchRegex }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    if (fabric) {
      const escapedFabric = fabric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fabricRegex = new RegExp(`^${escapedFabric}$|\\b${escapedFabric}\\b`, 'i');
      const fabricCond = [{ tags: fabricRegex }, { subcategory: fabricRegex }, { name: fabricRegex }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: fabricCond }];
        delete filter.$or;
      } else if (filter.$and) {
        filter.$and.push({ $or: fabricCond });
      } else {
        filter.$or = fabricCond;
      }
    }

    if (tag) {
      const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagRegex = new RegExp(`^${escapedTag}$|\\b${escapedTag}\\b`, 'i');
      filter.tags = tagRegex;
    }

    if (min_rating !== null && !isNaN(min_rating)) {
      filter.rating_avg = { $gte: min_rating };
    }

    if (min_price !== null || max_price !== null) {
      filter.price = {};
      if (min_price !== null && !isNaN(min_price)) filter.price.$gte = min_price;
      if (max_price !== null && !isNaN(max_price)) filter.price.$lte = max_price;
    }

    if (is_featured !== null) {
      filter.is_featured = is_featured;
    }

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

// Migrate & classify all existing products into exact subcategories (admin / migration trigger)
router.post('/admin/migrate-subcategories', async (req, res, next) => {
  try {
    const products = await Product.find({});
    let updatedCount = 0;

    for (const prod of products) {
      const name = prod.name ? prod.name.toLowerCase() : '';
      const desc = prod.description ? prod.description.toLowerCase() : '';
      const tagsList = Array.isArray(prod.tags) ? prod.tags.map(t => t.toLowerCase()) : [];
      const combined = `${name} ${desc} ${tagsList.join(' ')}`;

      let assignedSubcategory = 'Jewellery';

      if (combined.includes('bangle') || combined.includes('kada') || combined.includes('bracelet')) {
        assignedSubcategory = 'Bangles';
      } else if (combined.includes('earring') || combined.includes('jhumka') || combined.includes('stud')) {
        assignedSubcategory = 'Earrings';
      } else if (combined.includes('choker') || combined.includes('necklace') || combined.includes('haram') || combined.includes('neckset')) {
        assignedSubcategory = 'Necklaces';
      } else if (combined.includes('chain')) {
        assignedSubcategory = 'Chains';
      } else if (combined.includes('ring')) {
        assignedSubcategory = 'Rings';
      } else if (combined.includes('anklet')) {
        assignedSubcategory = 'Anklets';
      } else if (combined.includes('pendant')) {
        assignedSubcategory = 'Pendants';
      } else if (combined.includes('bridal set') || combined.includes('bridal jewellery')) {
        assignedSubcategory = 'Bridal Jewellery';
      } else if (combined.includes('kanchipuram') || combined.includes('kanjeevaram')) {
        assignedSubcategory = 'Kanchipuram Sarees';
      } else if (combined.includes('banarasi')) {
        assignedSubcategory = 'Banarasi Sarees';
      } else if (combined.includes('cotton saree')) {
        assignedSubcategory = 'Cotton Sarees';
      } else if (combined.includes('silk saree')) {
        assignedSubcategory = 'Silk Sarees';
      } else if (combined.includes('saree')) {
        assignedSubcategory = 'Silk Sarees';
      }

      const subSlug = assignedSubcategory.toLowerCase().replace(/\s+/g, '-');

      prod.subcategory = assignedSubcategory;
      prod.subcategory_slug = subSlug;

      const currentTags = new Set(Array.isArray(prod.tags) ? prod.tags : []);
      currentTags.add(assignedSubcategory);
      currentTags.add(assignedSubcategory.toLowerCase());
      prod.tags = Array.from(currentTags);

      await prod.save();
      updatedCount++;
    }

    res.json({ message: `Successfully classified ${updatedCount} products into precise subcategories.`, count: updatedCount });
  } catch (error) {
    next(error);
  }
});

// List all unique product tags & materials dynamically across all products (public)
router.get('/tags/all', async (req, res, next) => {
  try {
    const tags = await Product.distinct('tags', { is_active: true, is_approved: true });
    const cleanTags = [...new Set(tags.filter(Boolean).map(t => t.trim()))].sort();
    res.json(cleanTags);
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

    // Whitelist allowed fields to prevent mass assignment attacks
    // (prevents merchants from self-approving, inflating ratings, or changing ownership)
    const allowedProductFields = [
      'name', 'description', 'short_description', 'price', 'base_price', 'compare_price',
      'cost_price', 'sku', 'stock_quantity', 'low_stock_threshold', 'weight_grams',
      'images', 'tags', 'attributes', 'is_active', 'is_featured', 'category_id',
      'subcategory', 'subcategory_slug'
    ];
    allowedProductFields.forEach(field => {
      if (payload[field] !== undefined) {
        product[field] = payload[field];
      }
    });
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
