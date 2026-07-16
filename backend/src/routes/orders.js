const express = require('express');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Commission = require('../models/Commission');
const MerchantProfile = require('../models/MerchantProfile');
const { getCurrentUser, requireMerchantOrAdmin } = require('../middleware/auth');
const { generateOrderNumber } = require('../utils/helpers');
const { sendOrderConfirmationEmail } = require('../services/email');
const config = require('../config');

const cartRouter = express.Router();
const orderRouter = express.Router();

cartRouter.use(getCurrentUser);
orderRouter.use(getCurrentUser);

// Helper to enrich CartItem with Product info
const enrichCartItems = async (cartItems) => {
  const productIds = cartItems.map(item => item.product_id);
  const products = await Product.find({ id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p.id, p]));

  return cartItems.map(item => {
    const itemObj = item.toObject();
    itemObj.product = productMap.get(item.product_id) || null;
    return itemObj;
  });
};

// Helper to enrich Order with OrderItems
const enrichOrders = async (orders) => {
  const isArray = Array.isArray(orders);
  const items = isArray ? orders : [orders];

  const orderIds = items.map(o => o.id);
  const orderItems = await OrderItem.find({ order_id: { $in: orderIds } });

  const itemsMap = new Map();
  orderItems.forEach(item => {
    if (!itemsMap.has(item.order_id)) {
      itemsMap.set(item.order_id, []);
    }
    itemsMap.get(item.order_id).push(item);
  });

  const enriched = items.map(o => {
    const oObj = o.toObject();
    oObj.items = itemsMap.get(o.id) || [];
    return oObj;
  });

  return isArray ? enriched : enriched[0];
};

// ─── Cart Routes ─────────────────────────────────────────────────────────────

// Get Cart
cartRouter.get('/', async (req, res, next) => {
  try {
    const items = await CartItem.find({ user_id: req.user.id });
    const enriched = await enrichCartItems(items);

    const subtotal = enriched.reduce((sum, i) => {
      return sum + (i.product ? i.product.price * i.quantity : 0);
    }, 0);

    const item_count = enriched.reduce((sum, i) => sum + i.quantity, 0);

    res.json({
      items: enriched,
      subtotal,
      item_count
    });
  } catch (error) {
    next(error);
  }
});

// Add to Cart / Update Quantity
cartRouter.post('/add', async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    const product = await Product.findOne({ id: Number(product_id), is_active: true });
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ detail: `Only ${product.stock_quantity} in stock` });
    }

    // Upsert cart item
    let cartItem = await CartItem.findOne({ user_id: req.user.id, product_id: Number(product_id) });
    if (cartItem) {
      cartItem.quantity = quantity;
    } else {
      cartItem = new CartItem({
        user_id: req.user.id,
        product_id: Number(product_id),
        quantity
      });
    }

    await cartItem.save();
    res.status(201).json({ message: 'Cart updated' });
  } catch (error) {
    next(error);
  }
});

// Remove from Cart
cartRouter.delete('/:item_id', async (req, res, next) => {
  try {
    const itemId = Number(req.params.item_id);
    const item = await CartItem.findOne({ id: itemId, user_id: req.user.id });
    if (!item) {
      return res.status(404).json({ detail: 'Cart item not found' });
    }

    await CartItem.deleteOne({ id: itemId, user_id: req.user.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Clear Cart
cartRouter.delete('/', async (req, res, next) => {
  try {
    await CartItem.deleteMany({ user_id: req.user.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// ─── Coupon Validation ───────────────────────────────────────────────────────

orderRouter.post('/validate-coupon', async (req, res, next) => {
  try {
    const { code, order_amount } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), is_active: true });
    if (!coupon) {
      return res.json({ valid: false, discount_amount: 0, message: 'Invalid coupon code' });
    }

    const now = new Date();
    if (coupon.valid_until && now > coupon.valid_until) {
      return res.json({ valid: false, discount_amount: 0, message: 'Coupon has expired' });
    }

    if (now < coupon.valid_from) {
      return res.json({ valid: false, discount_amount: 0, message: 'Coupon not yet active' });
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return res.json({ valid: false, discount_amount: 0, message: 'Coupon usage limit reached' });
    }

    if (order_amount < coupon.min_order_amount) {
      return res.json({
        valid: false,
        discount_amount: 0,
        message: `Minimum order amount ₹${coupon.min_order_amount} required`
      });
    }

    res.json({
      valid: true,
      discount_amount: coupon.discount_amount,
      message: `Coupon applied! You save ₹${coupon.discount_amount}`
    });
  } catch (error) {
    next(error);
  }
});

// ─── Order Placement ─────────────────────────────────────────────────────────

// Create Order (Checkout)
orderRouter.post('/', async (req, res, next) => {
  try {
    const { address_id, coupon_code, payment_method, notes } = req.body;

    // Load Cart Items
    const cartItems = await CartItem.find({ user_id: req.user.id });
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ detail: 'Cart is empty' });
    }

    const enrichedCart = await enrichCartItems(cartItems);

    // Validate Stock
    for (const item of enrichedCart) {
      if (!item.product) {
        return res.status(400).json({ detail: 'Some products in your cart are no longer available' });
      }
      if (item.product.stock_quantity < item.quantity) {
        return res.status(400).json({ detail: `Insufficient stock for ${item.product.name}` });
      }
    }

    const subtotal = enrichedCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    let discount_amount = 0.0;
    let coupon = null;
    let coupon_id = null;

    // Apply Coupon
    if (coupon_code) {
      coupon = await Coupon.findOne({ code: coupon_code.toUpperCase(), is_active: true });
      if (coupon) {
        const now = new Date();
        const datesValid = (!coupon.valid_until || now <= coupon.valid_until) && now >= coupon.valid_from;
        const usesValid = !coupon.max_uses || coupon.used_count < coupon.max_uses;
        const minAmountValid = subtotal >= coupon.min_order_amount;

        if (datesValid && usesValid && minAmountValid) {
          discount_amount = coupon.discount_amount;
          coupon_id = coupon.id;
          coupon.used_count += 1;
          await coupon.save();
        }
      }
    }

    const shipping_amount = subtotal >= 2999 ? 0.0 : 99.0;
    const tax_amount = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const total_amount = subtotal - discount_amount + shipping_amount + tax_amount;

    let orderNumber = generateOrderNumber();
    while (true) {
      const existingOrder = await Order.findOne({ order_number: orderNumber });
      if (!existingOrder) break;
      orderNumber = generateOrderNumber();
    }

    const order = new Order({
      order_number: orderNumber,
      customer_id: req.user.id,
      address_id: address_id ? Number(address_id) : null,
      coupon_id: coupon_id,
      subtotal,
      discount_amount,
      shipping_amount,
      tax_amount,
      total_amount,
      status: 'pending',
      payment_status: 'pending',
      payment_method,
      notes,
      status_history: [
        { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' }
      ]
    });

    await order.save();

    // Create Order Items and decrease stock
    const emailItems = [];
    for (const item of enrichedCart) {
      const base_price = item.product.base_price || item.product.price;
      const pct = base_price < 1000 ? 0.05 : 0.10;
      const promoter_cut = base_price * pct;
      const admin_cut = base_price * pct;

      const merchant_payout = Number((base_price * item.quantity).toFixed(2));
      
      let platform_fee;
      if (coupon && coupon.promoter_id) {
        // Promoter coupon used: admin gets only admin_cut, promoter gets promoter_cut
        platform_fee = Number((admin_cut * item.quantity).toFixed(2));
      } else {
        // Direct purchase: admin gets both admin_cut and promoter_cut
        platform_fee = Number(((admin_cut + promoter_cut) * item.quantity).toFixed(2));
      }

      const orderItem = new OrderItem({
        order_id: order.id,
        product_id: item.product_id,
        merchant_id: item.product.merchant_id,
        product_name: item.product.name,
        product_image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        merchant_payout,
        platform_fee
      });

      await orderItem.save();

      // Reduce stock quantity and increase total sold
      await Product.updateOne(
        { id: item.product_id },
        {
          $inc: {
            stock_quantity: -item.quantity,
            total_sold: item.quantity
          }
        }
      );

      emailItems.push({
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price * item.quantity
      });
    }

    // Create commission record if promoter applies
    if (coupon && coupon.promoter_id && coupon_id) {
      let totalPromoterCommission = 0;
      for (const item of enrichedCart) {
        const base_price = item.product.base_price || item.product.price;
        const pct = base_price < 1000 ? 0.05 : 0.10;
        const promoter_cut = base_price * pct;
        totalPromoterCommission += promoter_cut * item.quantity;
      }

      const commission = new Commission({
        order_id: order.id,
        coupon_id: coupon_id,
        promoter_id: coupon.promoter_id,
        amount: Number(totalPromoterCommission.toFixed(2))
      });
      await commission.save();
    }

    // Clear cart items
    await CartItem.deleteMany({ user_id: req.user.id });

    // Send confirmation email asynchronously
    sendOrderConfirmationEmail(
      req.user.email,
      req.user.full_name,
      order.order_number,
      emailItems,
      order.total_amount
    ).catch(err => console.error(`Error sending order confirmation email:`, err));

    // Generate Razorpay Order
    let razorpay_order_id = null;
    if (config.razorpayKeyId && config.razorpayKeySecret) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: config.razorpayKeyId,
          key_secret: config.razorpayKeySecret
        });

        const options = {
          amount: Math.round(order.total_amount * 100), // in paise
          currency: 'INR',
          receipt: `rcpt_${order.order_number}`
        };

        const rzpOrder = await razorpay.orders.create(options);
        razorpay_order_id = rzpOrder.id;

        // Update local Order record
        order.razorpay_order_id = razorpay_order_id;
        await order.save();
      } catch (rzpErr) {
        console.error('[Razorpay] Failed to create order:', rzpErr);
      }
    }

    const enrichedOrder = await enrichOrders(order);
    const responseData = enrichedOrder.toObject ? enrichedOrder.toObject() : enrichedOrder;
    
    res.status(201).json({
      ...responseData,
      razorpay_order_id,
      razorpay_key_id: config.razorpayKeyId
    });
  } catch (error) {
    next(error);
  }
});

// Verify Razorpay Payment Signature
orderRouter.post('/verify-payment', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Sandbox Mock Mode fallback (if keys are missing or mock requested, approve payment directly)
    if (!config.razorpayKeyId || !config.razorpayKeySecret || razorpay_payment_id === "mock_payment") {
      console.log('[Razorpay Sandbox] Keys missing or mock requested. Approving payment directly.');
      
      const order = await Order.findOne({ 
        $or: [
          { razorpay_order_id: razorpay_order_id },
          { id: isNaN(Number(razorpay_order_id)) ? -1 : Number(razorpay_order_id) }
        ] 
      });
      if (!order) {
        return res.status(404).json({ detail: 'Order matching mock criteria not found' });
      }

      order.payment_status = 'paid';
      order.status = 'pending';
      order.razorpay_payment_id = razorpay_payment_id || 'mock_payment';
      order.razorpay_signature = razorpay_signature || 'mock_signature';

      const history = order.status_history || [];
      history.push({
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Payment mock-approved via Sandbox Mode',
        updated_by: req.user ? req.user.id : null
      });
      order.status_history = history;
      order.markModified('status_history');

      await order.save();

      const enriched = await enrichOrders(order);
      return res.json(enriched);
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ detail: 'Missing required Razorpay payment tracking parameters' });
    }

    // Verify crypto HMAC signature using official SDK or fallback manual generation
    let isSignatureValid = false;
    let generated_signature = '';
    
    try {
      const Razorpay = require('razorpay');
      isSignatureValid = Razorpay.validatePaymentVerification(
        { "order_id": razorpay_order_id, "payment_id": razorpay_payment_id },
        razorpay_signature,
        config.razorpayKeySecret
      );
    } catch (rzpErr) {
      console.warn('[Razorpay SDK] validatePaymentVerification failed, using crypto fallback:', rzpErr);
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', config.razorpayKeySecret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      generated_signature = hmac.digest('hex');
      isSignatureValid = (generated_signature === razorpay_signature);
    }

    if (!isSignatureValid) {
      console.error(`[Razorpay Signature Mismatch] Expected validation to pass. Razorpay Signature: ${razorpay_signature}${generated_signature ? `, Fallback Generated: ${generated_signature}` : ''}`);
      return res.status(400).json({ detail: 'Payment verification failed: signature mismatch' });
    }

    // Find the corresponding Order in our database
    const order = await Order.findOne({ razorpay_order_id: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ detail: 'Order matching Razorpay order ID not found' });
    }

    // Update the Order status & payment status
    order.payment_status = 'paid';
    order.status = 'pending';
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;

    // Log this status change in status history log
    const history = order.status_history || [];
    history.push({
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: `Payment verified via Razorpay (Payment ID: ${razorpay_payment_id})`,
      updated_by: req.user ? req.user.id : null
    });
    order.status_history = history;
    order.markModified('status_history');

    await order.save();

    const enriched = await enrichOrders(order);
    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// List Customer Orders
orderRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size || '10', 10)));
    const status = req.query.status || null;

    const filter = { customer_id: req.user.id };
    if (status) {
      filter.status = status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const enriched = await enrichOrders(orders);

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

// Incoming Merchant Orders
orderRouter.get('/merchant/incoming', requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const status = req.query.status || null;

    const merchant = await MerchantProfile.findOne({ user_id: req.user.id });
    if (!merchant) {
      return res.status(404).json({ detail: 'Merchant profile not found' });
    }

    // Get order IDs that have items owned by this merchant
    const merchantItems = await OrderItem.find({ merchant_id: merchant.id });
    const orderIds = [...new Set(merchantItems.map(item => item.order_id))];

    const filter = { id: { $in: orderIds } };
    if (status) {
      filter.status = status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const enriched = await enrichOrders(orders);

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

// Get Order Details
orderRouter.get('/:order_id', async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    // Customers can only view their own; merchant/admin/support can view all
    const hasPermission = req.user.role !== 'customer' || order.customer_id === req.user.id;
    if (!hasPermission) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    // If payment is pending and razorpay_order_id is missing, generate one on the fly!
    if (order.payment_status === 'pending' && !order.razorpay_order_id && config.razorpayKeyId && config.razorpayKeySecret) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: config.razorpayKeyId,
          key_secret: config.razorpayKeySecret
        });

        const options = {
          amount: Math.round(order.total_amount * 100), // in paise
          currency: 'INR',
          receipt: `rcpt_${order.order_number}`
        };

        const rzpOrder = await razorpay.orders.create(options);
        order.razorpay_order_id = rzpOrder.id;
        await order.save();
      } catch (rzpErr) {
        console.error('[Razorpay] Dynamic order creation failed:', rzpErr);
      }
    }

    const enriched = await enrichOrders(order);
    const responseData = enriched.toObject ? enriched.toObject() : enriched;
    res.json({
      ...responseData,
      razorpay_key_id: config.razorpayKeyId
    });
  } catch (error) {
    next(error);
  }
});

// Update Order Status (Merchant / Admin)
orderRouter.patch('/:order_id/status', requireMerchantOrAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const { status, tracking_number, notes, current_location } = req.body;

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    order.status = status;
    if (tracking_number !== undefined) {
      order.tracking_number = tracking_number;
    }
    if (current_location !== undefined) {
      order.current_location = current_location;
    }

    if (status === 'delivered') {
      order.delivered_at = new Date();
      order.payment_status = 'paid';

      // ─── Settlement Holding Integration ───
      try {
        const OrderItem = require('../models/OrderItem');
        const MerchantProfile = require('../models/MerchantProfile');
        const Settlement = require('../models/Settlement');
        const Wallet = require('../models/Wallet');

        const orderItems = await OrderItem.find({ order_id: order.id });
        
        // Group items by merchant_id
        const merchantGroups = new Map();
        orderItems.forEach(item => {
          if (!merchantGroups.has(item.merchant_id)) {
            merchantGroups.set(item.merchant_id, []);
          }
          merchantGroups.get(item.merchant_id).push(item);
        });

        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + 7); // 7-day buyer protection escrow hold

        for (const [merchantId, items] of merchantGroups.entries()) {
          const merchant_share = Number(items.reduce((sum, item) => sum + item.merchant_payout, 0).toFixed(2));
          const platform_commission = Number(items.reduce((sum, item) => sum + item.platform_fee, 0).toFixed(2));

          // 1. Create Escrow Settlement record
          const settlement = new Settlement({
            order_id: order.id,
            merchant_id: merchantId,
            amount: merchant_share,
            platform_commission: platform_commission,
            status: 'escrow_hold',
            release_date: releaseDate
          });
          await settlement.save();

          // 2. Credit Wallet pending balance
          let wallet = await Wallet.findOne({ merchant_id: merchantId });
          if (!wallet) {
            wallet = new Wallet({ merchant_id: merchantId });
          }
          wallet.pending_balance = Number(((wallet.pending_balance || 0) + merchant_share).toFixed(2));
          await wallet.save();

          console.log(`[Escrow] Created 7-day escrow hold for Merchant Profile #${merchantId} (₹${merchant_share}) on Order #${order.order_number}`);
        }
      } catch (escrowErr) {
        console.error('Failed to process escrow hold settlements on delivery:', escrowErr);
      }
    }

    // Append to status history log
    const history = order.status_history || [];
    history.push({
      status,
      timestamp: new Date().toISOString(),
      note: notes || '',
      updated_by: req.user.id
    });
    order.status_history = history;

    // Save and return
    order.markModified('status_history');
    await order.save();

    const enriched = await enrichOrders(order);
    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// Cancel Order (Customer self-service)
orderRouter.post('/:order_id/cancel', async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    // Verify ownership
    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    // Check status eligibility (can only cancel before shipping / processing)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        detail: `This order is already in "${order.status}" status and cannot be self-cancelled. Please contact support.` 
      });
    }

    // Update status to cancelled
    order.status = 'cancelled';
    
    const history = order.status_history || [];
    history.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      note: 'Cancelled by customer',
      updated_by: req.user.id
    });
    order.status_history = history;
    order.markModified('status_history');
    await order.save();

    // Restore inventory stock levels
    const orderItems = await OrderItem.find({ order_id: order.id });
    for (const item of orderItems) {
      await Product.updateOne(
        { id: item.product_id },
        {
          $inc: {
            stock_quantity: item.quantity,
            total_sold: -item.quantity
          }
        }
      );
    }

    const enriched = await enrichOrders(order);
    res.json(enriched);
  } catch (error) {
    next(error);
  }
});


module.exports = {
  cartRouter,
  orderRouter
};
