const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const MerchantProfile = require('../models/MerchantProfile');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Coupon = require('../models/Coupon');
const Address = require('../models/Address');

async function checkStatus() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';
  
  // Connect if not already connected
  let connectedHere = false;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    connectedHere = true;
  }
  
  try {
    const counts = {
      users: await User.countDocuments(),
      categories: await Category.countDocuments(),
      products: await Product.countDocuments(),
      merchantProfiles: await MerchantProfile.countDocuments(),
      orders: await Order.countDocuments(),
      orderItems: await OrderItem.countDocuments(),
      coupons: await Coupon.countDocuments(),
      addresses: await Address.countDocuments(),
    };
    
    const usersList = await User.find({}, 'email role full_name id');
    const categoriesList = await Category.find({}, 'name slug id');
    const productsList = await Product.find({}, 'name sku category_id price');
    
    let report = `--- DATABASE SEEDING STATUS REPORT ---\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    report += `COUNTS:\n`;
    for (const [key, val] of Object.entries(counts)) {
      report += `- ${key}: ${val}\n`;
    }
    
    report += `\nUSERS:\n`;
    usersList.forEach(u => {
      report += `- ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Name: ${u.full_name}\n`;
    });
    
    report += `\nCATEGORIES:\n`;
    categoriesList.forEach(c => {
      report += `- ID: ${c.id} | Slug: ${c.slug} | Name: ${c.name}\n`;
    });
    
    report += `\nPRODUCTS (First 5):\n`;
    productsList.slice(0, 5).forEach(p => {
      report += `- SKU: ${p.sku} | Price: ${p.price} | CatID: ${p.category_id} | Name: ${p.name}\n`;
    });
    
    const statusFilePath = path.join(__dirname, '../../seeding_status.txt');
    fs.writeFileSync(statusFilePath, report);
    console.log(`[Status Checker] Report written to ${statusFilePath}`);
  } catch (err) {
    console.error('[Status Checker] Error generating report:', err);
  } finally {
    if (connectedHere) {
      await mongoose.disconnect();
    }
  }
}

checkStatus();
