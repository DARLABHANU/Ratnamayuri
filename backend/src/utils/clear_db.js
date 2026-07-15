const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const config = require('../config');

// Import all models
const Address = require('../models/Address');
const AuditLog = require('../models/AuditLog');
const CartItem = require('../models/CartItem');
const Category = require('../models/Category');
const Commission = require('../models/Commission');
const Counter = require('../models/Counter');
const Coupon = require('../models/Coupon');
const MerchantProfile = require('../models/MerchantProfile');
const OTPCode = require('../models/OTPCode');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Settlement = require('../models/Settlement');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Wishlist = require('../models/Wishlist');
const WithdrawalRequest = require('../models/WithdrawalRequest');

const { hashPassword } = require('../middleware/auth');

const clearAndSeed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in env');
    process.exit(1);
  }

  console.log(`Connecting to: ${uri}...`);
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');

    // 1. Delete all documents from all collections
    console.log('Clearing all collections...');
    await Address.deleteMany({});
    await AuditLog.deleteMany({});
    await CartItem.deleteMany({});
    await Category.deleteMany({});
    await Commission.deleteMany({});
    await Counter.deleteMany({});
    await Coupon.deleteMany({});
    await MerchantProfile.deleteMany({});
    await OTPCode.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Settlement.deleteMany({});
    await SupportTicket.deleteMany({});
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Wishlist.deleteMany({});
    await WithdrawalRequest.deleteMany({});
    console.log('All collections cleared successfully.');

    // 2. Initialize Counters
    console.log('Initializing counters...');
    await Counter.create({ _id: 'productId', seq: 0 });
    await Counter.create({ _id: 'cartItemId', seq: 0 });
    await Counter.create({ _id: 'ticketId', seq: 0 });
    await Counter.create({ _id: 'orderId', seq: 0 });
    await Counter.create({ _id: 'userId', seq: 0 });
    console.log('Counters initialized.');

    // 3. Seed Default Administrator Account
    console.log('Seeding default administrator...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ratnamayuri.live';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!';
    const hashedPassword = await hashPassword(adminPassword);

    const admin = new User({
      email: adminEmail.toLowerCase(),
      hashed_password: hashedPassword,
      full_name: 'Super Admin',
      role: 'admin',
      account_number: 'RM0000000000',
      is_verified: true,
      is_active: true,
      is_first_login: false
    });

    await admin.save();
    console.log(`Successfully seeded Admin: ${adminEmail} (password: ${adminPassword})`);

  } catch (error) {
    console.error('Error clearing/seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

clearAndSeed();
