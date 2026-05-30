const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Address = require('../models/Address');
const MerchantProfile = require('../models/MerchantProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB successfully!');

  // 1. Find the merchant "darlabhanumurthy@gmail.com"
  const merchantUser = await User.findOne({ email: 'darlabhanumurthy@gmail.com' });
  if (!merchantUser) {
    console.error('Merchant user darlabhanumurthy@gmail.com not found. Please log in first or run the product seeder!');
    process.exit(1);
  }
  
  // Resolve actual MerchantProfile ID
  const merchantProfile = await MerchantProfile.findOne({ user_id: merchantUser.id });
  const merchantId = merchantProfile ? merchantProfile.id : merchantUser.id;
  console.log(`Resolved Merchant darlabhanumurthy@gmail.com -> User ID: ${merchantUser.id}, Profile ID: ${merchantId}`);

  // 2. Fetch the merchant's products to build realistic orders
  const products = await Product.find({ merchant_id: merchantId });
  if (products.length === 0) {
    console.error('No products found for this merchant. Please seed the products first!');
    process.exit(1);
  }
  console.log(`Found ${products.length} products to use for creating mock orders.`);

  // 3. Seed some customer users
  const demoCustomers = [
    { email: 'priya.sharma@gmail.com', name: 'Priya Sharma', phone: '9876543210' },
    { email: 'amit.verma@yahoo.com', name: 'Amit Verma', phone: '9812345678' },
    { email: 'neha.reddy@gmail.com', name: 'Neha Reddy', phone: '8899001122' }
  ];

  const customers = [];
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Customer@123!', salt);

  for (const cust of demoCustomers) {
    let user = await User.findOne({ email: cust.email });
    if (!user) {
      user = new User({
        email: cust.email,
        hashed_password: hashedPassword,
        full_name: cust.name,
        phone: cust.phone,
        role: 'customer',
        account_number: 'ACC' + Math.floor(100000 + Math.random() * 900000),
        is_verified: true,
        is_first_login: false
      });
      await user.save();
      console.log(`Seeded Customer: ${cust.name} (${cust.email})`);
    } else {
      console.log(`Customer already exists: ${cust.name}`);
    }
    customers.push(user);
  }

  // 4. Seed some Addresses for these customers
  const addresses = [];
  for (const customer of customers) {
    let addr = await Address.findOne({ user_id: customer.id });
    if (!addr) {
      addr = new Address({
        user_id: customer.id,
        label: 'Home',
        full_name: customer.full_name,
        phone: customer.phone,
        line1: 'Flat 405, Prestige Heritage Apartments',
        line2: 'MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India',
        is_default: true
      });
      await addr.save();
      console.log(`Seeded address for customer ID: ${customer.id}`);
    }
    addresses.push(addr);
  }

  // 5. Seed some promotional coupons
  const demoCoupons = [
    { code: 'WELCOME200', discount_amount: 200, promoter_commission: 50, platform_profit: 50, min_order_amount: 1000 },
    { code: 'FESTIVE500', discount_amount: 500, promoter_commission: 100, platform_profit: 100, min_order_amount: 5000 }
  ];
  const coupons = [];
  for (const coup of demoCoupons) {
    let existingCoup = await Coupon.findOne({ code: coup.code });
    if (!existingCoup) {
      existingCoup = new Coupon({
        code: coup.code,
        discount_amount: coup.discount_amount,
        promoter_commission: coup.promoter_commission,
        platform_profit: coup.platform_profit,
        min_order_amount: coup.min_order_amount,
        is_active: true,
        max_uses: 1000,
        used_count: 5
      });
      await existingCoup.save();
      console.log(`Seeded Coupon: ${coup.code}`);
    }
    coupons.push(existingCoup);
  }

  // 6. Seed mock orders spanning the past 7 days to populate analytics
  console.log('Generating realistic order history across the past 7 days...');
  
  // Clear only mock orders for these demo customers
  await Order.deleteMany({ customer_id: { $in: customers.map(c => c.id) } });
  
  // Also clear any associated order items first to avoid orphan mock rows
  const oldOrders = await Order.find({ customer_id: { $in: customers.map(c => c.id) } });
  await OrderItem.deleteMany({ order_id: { $in: oldOrders.map(o => o.id) } });
  
  console.log('Cleared existing mock orders and order items.');

  const orderStatuses = ['delivered', 'shipped', 'processing', 'confirmed', 'pending'];
  const baseDate = new Date();

  // Create 8 realistic orders
  for (let i = 0; i < 8; i++) {
    const customer = customers[i % customers.length];
    const address = addresses[i % addresses.length];
    const coupon = i % 3 === 0 ? coupons[0] : (i % 5 === 0 ? coupons[1] : null);

    // Pick 1-2 random products
    const p1 = products[Math.floor(Math.random() * products.length)];
    const p2 = products[(Math.floor(Math.random() * products.length) + 1) % products.length];
    const orderItemsList = [
      { product: p1, qty: 1 },
    ];
    if (i % 2 === 0 && p1.id !== p2.id) {
      orderItemsList.push({ product: p2, qty: 1 });
    }

    let subtotal = 0;
    orderItemsList.forEach(item => {
      subtotal += item.product.price * item.qty;
    });

    const discountAmount = coupon && subtotal >= coupon.min_order_amount ? coupon.discount_amount : 0;
    const shippingAmount = subtotal > 2999 ? 0 : 150;
    const taxAmount = Math.round(subtotal * 0.03); // 3% jewellery/textile standard GST
    const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

    // Shift creation date to create a timeline chart
    const orderDate = new Date();
    orderDate.setDate(baseDate.getDate() - i); // Spans 8 days

    const orderNum = `ORD-${orderDate.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const status = i < 4 ? 'delivered' : orderStatuses[i % orderStatuses.length];
    const paymentStatus = status === 'delivered' || status === 'shipped' || i % 3 !== 0 ? 'paid' : 'pending';

    const order = new Order({
      order_number: orderNum,
      customer_id: customer.id,
      address_id: address.id,
      coupon_id: coupon ? coupon.id : null,
      subtotal: subtotal,
      discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: status,
      payment_status: paymentStatus,
      payment_method: 'Razorpay Credit Card',
      payment_reference: 'pay_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      created_at: orderDate,
      updated_at: orderDate,
      delivered_at: status === 'delivered' ? orderDate : null
    });

    await order.save();
    console.log(`Saved Order ${orderNum} (Status: ${status}, Date: ${orderDate.toLocaleDateString()})`);

    // Create Order Items
    for (const item of orderItemsList) {
      const itemPrice = item.product.price;
      const itemTotal = itemPrice * item.qty;
      const platformFee = Math.round(itemTotal * 0.10); // 10% platform commission
      const merchantPayout = itemTotal - platformFee;

      const orderItemDoc = new OrderItem({
        order_id: order.id,
        product_id: item.product.id,
        merchant_id: merchantId,
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        quantity: item.qty,
        unit_price: itemPrice,
        total_price: itemTotal,
        merchant_payout: merchantPayout,
        platform_fee: platformFee
      });

      await orderItemDoc.save();

      // Dynamically update total_sold on product
      if (status === 'delivered' || status === 'shipped') {
        await Product.findByIdAndUpdate(item.product._id, { $inc: { total_sold: item.qty } });
      }
    }
  }

  console.log('\nSeeding completed successfully!');
  console.log('- 3 Customers created/verified with Addresses.');
  console.log('- 2 Coupons created.');
  console.log('- 8 Orders populated spanning the last 7 days.');
  console.log('Your dashboards and analytical charts are now fully populated and active!');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Error seeding analytics data:', err);
    process.exit(1);
  });
}

module.exports = { seed };
