const express = require('express');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { getCurrentUser } = require('../middleware/auth');

const router = express.Router();

router.use(getCurrentUser);

// Get wishlist items
router.get('/', async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user_id: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user_id: req.user.id, product_ids: [] });
      await wishlist.save();
    }

    // Populate products
    const products = await Product.find({
      id: { $in: wishlist.product_ids },
      is_active: true,
      is_approved: true
    });

    res.json({
      product_ids: wishlist.product_ids,
      items: products
    });
  } catch (error) {
    next(error);
  }
});

// Toggle wishlist item
router.post('/toggle', async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (product_id === undefined) {
      return res.status(400).json({ detail: 'Missing product_id in request body' });
    }

    const prodNum = Number(product_id);
    const productExists = await Product.findOne({ id: prodNum });
    if (!productExists) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user_id: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user_id: req.user.id, product_ids: [] });
    }

    const index = wishlist.product_ids.indexOf(prodNum);
    let wishlisted = false;

    if (index === -1) {
      wishlist.product_ids.push(prodNum);
      wishlisted = true;
    } else {
      wishlist.product_ids.splice(index, 1);
      wishlisted = false;
    }

    await wishlist.save();

    res.json({
      wishlisted,
      product_ids: wishlist.product_ids
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
