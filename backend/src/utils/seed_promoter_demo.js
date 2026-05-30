const mongoose = require('mongoose');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Commission = require('../models/Commission');
const Counter = require('../models/Counter');

const MONGODB_URI = 'mongodb://localhost:27017/ratnamayuri';

async function seedPromoterDemo() {
  console.log('[Demo Seeder] Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  
  try {
    // 1. Find the promoter user (daarlabhanumurthy@gmail.com)
    const promoter = await User.findOne({ email: 'daarlabhanumurthy@gmail.com' });
    if (!promoter) {
      console.error('[Error] Promoter user daarlabhanumurthy@gmail.com not found. Run status check first.');
      process.exit(1);
    }
    console.log(`[Demo Seeder] Found Promoter User: ${promoter.full_name} (ID: ${promoter.id})`);

    // 2. Find a customer user to act as the purchaser
    const buyer = await User.findOne({ email: 'priya.sharma@gmail.com' }) || await User.findOne({ role: 'customer' });
    if (!buyer) {
      console.error('[Error] Buyer customer not found.');
      process.exit(1);
    }
    console.log(`[Demo Seeder] Found Buyer User: ${buyer.full_name} (ID: ${buyer.id})`);

    // 3. Create or fetch the promoter Coupon "BHANU15"
    let coupon = await Coupon.findOne({ code: 'BHANU15' });
    if (!coupon) {
      coupon = new Coupon({
        code: 'BHANU15',
        description: 'Bhanu Custom Promoter Discount 15%',
        discount_amount: 200,
        promoter_commission: 100,
        platform_profit: 100,
        promoter_id: promoter.id,
        min_order_amount: 1000,
        is_active: true
      });
      await coupon.save();
      console.log(`[Demo Seeder] Created Promoter Coupon: ${coupon.code} (ID: ${coupon.id})`);
    } else {
      coupon.promoter_id = promoter.id;
      await coupon.save();
      console.log(`[Demo Seeder] Linked existing Promoter Coupon: ${coupon.code} (ID: ${coupon.id})`);
    }

    // 4. Seed 3 referred orders using this coupon
    const orderDetails = [
      { order_number: 'RMREF1001', status: 'delivered', commission_status: 'paid' },
      { order_number: 'RMREF1002', status: 'shipped', commission_status: 'approved' },
      { order_number: 'RMREF1003', status: 'processing', commission_status: 'pending' }
    ];

    // Clean up any failed remnants from the first run
    await Order.deleteMany({ order_number: { $in: ['RMREF1001', 'RMREF1002', 'RMREF1003'] } });
    await Commission.deleteMany({ promoter_id: promoter.id });

    for (const details of orderDetails) {
      // Increment orderId sequence
      const orderIdCounter = await Counter.findByIdAndUpdate(
        'orderId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const order = new Order({
        id: orderIdCounter.seq,
        order_number: details.order_number,
        customer_id: buyer.id,
        subtotal: 18500,
        discount_amount: 200,
        shipping_amount: 0,
        tax_amount: 3294,
        total_amount: 21594,
        status: details.status,
        payment_status: 'paid',
        payment_method: 'upi',
        payment_reference: `pay_ref_${Math.random().toString(36).substring(7)}`,
        coupon_id: coupon.id
      });
      await order.save();
      console.log(`[Demo Seeder] Created Order: ${order.order_number} (ID: ${order.id})`);

      // Create OrderItem
      const orderItemCounter = await Counter.findByIdAndUpdate(
        'orderItemId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const item = new OrderItem({
        id: orderItemCounter.seq,
        order_id: order.id,
        product_id: 18, // Royal Emerald Kanjivaram Silk Saree
        product_name: "Royal Emerald Kanjivaram Silk Saree",
        merchant_id: 11,
        quantity: 1,
        price: 18500,
        unit_price: 18500,
        total_price: 18500,
        merchant_payout: 16650,
        commission_rate: 0.1
      });
      await item.save();

      // Create corresponding Commission record
      const commission = new Commission({
        order_id: order.id,
        coupon_id: coupon.id,
        promoter_id: promoter.id,
        amount: coupon.promoter_commission,
        status: details.commission_status
      });
      await commission.save();
      console.log(`[Demo Seeder] Logged Commission for Order ${order.order_number}: ₹${commission.amount} (${commission.status})`);
    }

    console.log('[Demo Seeder] Seeding process completed successfully!');
  } catch (err) {
    console.error('[Demo Seeder] Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Demo Seeder] Disconnected from database.');
  }
}

seedPromoterDemo();
