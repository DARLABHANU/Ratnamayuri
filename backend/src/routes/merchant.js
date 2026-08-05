const express = require('express');
const MerchantProfile = require('../models/MerchantProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Commission = require('../models/Commission');
const { getCurrentUser, requireMerchantOrAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── Profile Management ──────────────────────────────────────────────────────

// Create Profile
router.post('/profile', getCurrentUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ detail: 'Only merchants can create profiles' });
    }

    const existing = await MerchantProfile.findOne({ user_id: req.user.id });
    if (existing) {
      return res.status(409).json({ detail: 'Merchant profile already exists' });
    }

    const profile = new MerchantProfile({
      user_id: req.user.id,
      ...req.body,
      is_approved: req.user.is_verified // Automatically approve if the admin already verified this user
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
});

// Get Profile
router.get('/profile', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

const { validateGSTIN, validateBankAccount, validateIFSC } = require('../utils/validators');

// Update Profile
router.put('/profile', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    if (req.body.gstin && req.body.gstin.trim() && !validateGSTIN(req.body.gstin.trim().toUpperCase())) {
      return res.status(400).json({ detail: 'Invalid GSTIN format. Expected 15-character alphanumeric GSTIN (e.g. 37ABCDE1234F1Z5).' });
    }

    if (req.body.bank_account && req.body.bank_account.trim() && !validateBankAccount(req.body.bank_account.trim())) {
      return res.status(400).json({ detail: 'Invalid Bank Account Number. Must be 9 to 18 numeric digits.' });
    }

    if (req.body.ifsc_code && req.body.ifsc_code.trim() && !validateIFSC(req.body.ifsc_code.trim().toUpperCase())) {
      return res.status(400).json({ detail: 'Invalid IFSC Code. Must be 11 characters (e.g. SBIN0001234).' });
    }

    // Whitelist allowed fields to prevent mass assignment attacks
    const allowedFields = ['business_name', 'business_description', 'gstin', 'bank_account', 'ifsc_code', 'logo_url'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });
    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');

    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get order IDs from delivered orders in the selected period
    const orders = await Order.find({
      status: 'delivered',
      created_at: { $gte: since }
    });
    const orderIds = orders.map(o => o.id);

    // Get matching order items for this merchant in the period
    const orderItems = await OrderItem.find({
      merchant_id: profile.id,
      order_id: { $in: orderIds }
    });

    // Total revenue from the period
    const total_revenue = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    // Total unique orders in the period
    const total_orders = new Set(orderItems.map(item => item.order_id)).size;

    // Total products listed
    const total_products = await Product.countDocuments({ merchant_id: profile.id });

    // Top products by revenue in the period
    const productSales = {};
    orderItems.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, revenue: 0, units_sold: 0 };
      }
      productSales[item.product_name].revenue += item.total_price;
      productSales[item.product_name].units_sold += item.quantity;
    });

    const top_products = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ─── Wallet balances (source of truth for payouts) ─────────────────────
    // Read directly from Wallet model — this correctly reflects escrow releases
    // done by the SLA scheduler, rather than recalculating from raw OrderItems.
    let wallet = await Wallet.findOne({ merchant_id: profile.id });
    if (!wallet) {
      wallet = new Wallet({ merchant_id: profile.id });
      await wallet.save();
    }

    const pending_payout   = wallet.pending_balance   || 0; // In escrow (7-day hold)
    const available_payout = wallet.available_balance || 0; // Released, ready to withdraw
    const withdrawn_payout = wallet.withdrawn_balance || 0; // Already requested/paid out

    const productsList = await Product.find({ merchant_id: profile.id, is_active: true });
    const low_stock_products = productsList
      .filter(p => p.stock_quantity <= (p.low_stock_threshold || 5))
      .map(p => ({
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold || 5
      }));

    res.json({
      total_revenue,
      total_orders,
      total_products,
      top_products,
      pending_payout,
      available_payout,
      withdrawn_payout,
      low_stock_products,
      period_days: days
    });
  } catch (error) {
    next(error);
  }
});

// Promoter Commissions
router.get('/commissions', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const commissions = await Commission.find({ promoter_id: req.user.id })
      .sort({ created_at: -1 });
    res.json(commissions);
  } catch (error) {
    next(error);
  }
});

// ─── Wallet & Withdrawals ───────────────────────────────────────────────────

// Get Merchant Wallet
router.get('/wallet', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    let wallet = await Wallet.findOne({ merchant_id: profile.id });
    if (!wallet) {
      wallet = new Wallet({ merchant_id: profile.id });
      await wallet.save();
    }
    res.json(wallet);
  } catch (error) {
    next(error);
  }
});

// Request Withdrawal
router.post('/withdraw', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Wallet = require('../models/Wallet');
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const { amount, bank_name, account_number, routing_details } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ detail: 'Invalid withdrawal amount specified' });
    }

    let wallet = await Wallet.findOne({ merchant_id: profile.id });
    if (!wallet || wallet.available_balance < amount) {
      return res.status(400).json({ detail: 'Insufficient available balance' });
    }

    // Deduct available balance and place it into withdrawn/reserved state
    wallet.available_balance = Number((wallet.available_balance - amount).toFixed(2));
    wallet.withdrawn_balance = Number(((wallet.withdrawn_balance || 0) + amount).toFixed(2));
    await wallet.save();

    // Create withdrawal request
    const request = new WithdrawalRequest({
      merchant_id: profile.id,
      amount,
      bank_name,
      account_number,
      routing_details,
      status: 'pending'
    });
    await request.save();

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// RFC 4180 compliant CSV Parser
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}

// Bulk CSV Product Upload
router.post('/products/bulk-upload', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const { csvData, imageMap } = req.body;
    if (!csvData) {
      return res.status(400).json({ detail: 'Missing csvData in request body' });
    }

    const rows = parseCSV(csvData);
    if (rows.length < 2) {
      return res.status(400).json({ detail: 'CSV must contain at least a header row and one data row' });
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const colIndex = (name) => headers.indexOf(name);
    
    const nameIdx = colIndex('name');
    const descIdx = colIndex('description');
    const basePriceIdx = colIndex('base_price');
    const comparePriceIdx = colIndex('compare_price');
    const skuIdx = colIndex('sku');
    const stockIdx = colIndex('stock_quantity');
    const lowStockIdx = colIndex('low_stock_threshold');
    const weightIdx = colIndex('weight_grams');
    const imagesIdx = colIndex('images');
    const tagsIdx = colIndex('tags');

    if (nameIdx === -1 || basePriceIdx === -1) {
      return res.status(400).json({ detail: 'CSV must contain at least "name" and "base_price" columns' });
    }

    const successes = [];
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= 1 && row[0] === '') continue;

      try {
        const name = row[nameIdx]?.trim();
        const base_price = parseFloat(row[basePriceIdx]);

        if (!name) throw new Error('Product name is required');
        if (isNaN(base_price) || base_price <= 0) throw new Error('Invalid base_price (must be greater than 0)');

        const description = descIdx !== -1 ? row[descIdx]?.trim() : '';
        const compare_price = comparePriceIdx !== -1 ? parseFloat(row[comparePriceIdx]) : null;
        const sku = skuIdx !== -1 ? row[skuIdx]?.trim() || null : null;
        const stock_quantity = stockIdx !== -1 ? parseInt(row[stockIdx]) || 0 : 0;
        const low_stock_threshold = lowStockIdx !== -1 ? parseInt(row[lowStockIdx]) || 5 : 5;
        const weight_grams = weightIdx !== -1 ? parseFloat(row[weightIdx]) || null : null;
        const imagesRaw = imagesIdx !== -1 ? row[imagesIdx]?.trim() : '';
        const tagsRaw = tagsIdx !== -1 ? row[tagsIdx]?.trim() : '';

        const images = imagesRaw ? imagesRaw.split(';').map(val => {
          const key = val.trim();
          if (imageMap && imageMap[key]) {
            return imageMap[key];
          }
          return key;
        }) : [];
        const tags = tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()) : [];

        if (sku) {
          const existingSku = await Product.findOne({ sku });
          if (existingSku) {
            throw new Error(`SKU "${sku}" is already in use`);
          }
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

        const product = new Product({
          merchant_id: profile.id,
          name,
          slug,
          description,
          base_price,
          price: base_price,
          compare_price: isNaN(compare_price) ? null : compare_price,
          sku,
          stock_quantity,
          low_stock_threshold,
          weight_grams,
          images,
          tags,
          is_approved: false,
          is_active: true
        });

        await product.save();
        successes.push({ name, sku });
      } catch (err) {
        errors.push({ rowNumber: i + 1, detail: err.message });
      }
    }

    res.json({
      success_count: successes.length,
      error_count: errors.length,
      successes,
      errors
    });
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Withdrawal Requests
router.get('/withdrawals', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.page_size) || 10;
    const skip = (page - 1) * pageSize;

    const filter = { merchant_id: profile.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await WithdrawalRequest.countDocuments(filter);
    const items = await WithdrawalRequest.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Escrow Settlements
router.get('/settlements', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Settlement = require('../models/Settlement');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.page_size) || 10;
    const skip = (page - 1) * pageSize;

    const filter = { merchant_id: profile.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Settlement.countDocuments(filter);
    const items = await Settlement.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    const Order = require('../models/Order');
    const enriched = await Promise.all(items.map(async (item) => {
      const plain = item.toObject();
      const order = await Order.findOne({ id: item.order_id });
      plain.order_number = order ? order.order_number : `Order #${item.order_id}`;
      return plain;
    }));

    res.json({
      items: enriched,
      total,
      page,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Reviews
router.get('/reviews', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    // 1. Find all products belonging to this merchant
    const products = await Product.find({ merchant_id: profile.id });
    const productIds = products.map(p => p.id);

    // 2. Fetch reviews for those products
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.page_size) || 10;
    const skip = (page - 1) * pageSize;

    const total = await Review.countDocuments({ product_id: { $in: productIds } });
    const items = await Review.find({ product_id: { $in: productIds } })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    // Enrich with user name and product name
    const User = require('../models/User');
    const enriched = await Promise.all(items.map(async (item) => {
      const plain = item.toObject();
      const product = products.find(p => p.id === item.product_id);
      const user = await User.findOne({ id: item.user_id });
      plain.product_name = product ? product.name : 'Unknown Product';
      plain.customer_name = user ? user.full_name : 'Customer';
      return plain;
    }));

    res.json({
      items: enriched,
      total,
      page,
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Customers
router.get('/customers', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    // Since we don't have a direct "MerchantCustomer" table, we can aggregate from Orders
    const orders = await Order.find({ merchant_id: profile.id });
    
    const customersMap = {};
    orders.forEach(order => {
      const uId = order.user_id;
      if (!uId) return;
      if (!customersMap[uId]) {
        customersMap[uId] = {
          user_id: uId,
          total_orders: 0,
          total_spent: 0,
          last_order: null
        };
      }
      customersMap[uId].total_orders += 1;
      customersMap[uId].total_spent += order.total_amount;
      
      const orderDate = new Date(order.created_at);
      if (!customersMap[uId].last_order || orderDate > new Date(customersMap[uId].last_order)) {
        customersMap[uId].last_order = order.created_at;
      }
    });

    const items = Object.values(customersMap);
    
    // Sort by most recent order
    items.sort((a, b) => new Date(b.last_order) - new Date(a.last_order));

    // Enrich with user name and email
    const User = require('../models/User');
    const enriched = await Promise.all(items.map(async (item) => {
      const user = await User.findOne({ id: item.user_id });
      return {
        ...item,
        name: user ? user.full_name : 'Customer',
        email: user ? user.email : 'N/A'
      };
    }));

    res.json({
      items: enriched,
      total: enriched.length,
      page: 1,
      pages: 1
    });
  } catch (error) {
    next(error);
  }
});

// Get Merchant's Coupons
router.get('/coupons', getCurrentUser, requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const profile = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    const coupons = await Coupon.find({ created_by: req.user.id }).sort({ created_at: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
