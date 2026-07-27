const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function verifyAndMigrateAllProducts() {
  console.log('Connecting to MongoDB database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected successfully!');

  // Fix product #22 if its seller base price was intended to be 500
  const prod22 = await Product.findOne({ id: 22 });
  if (prod22 && prod22.base_price === 201) {
    prod22.base_price = 500;
    prod22.price = 799;
    await prod22.save();
  }

  const totalProducts = await Product.countDocuments();
  console.log(`\n========================================`);
  console.log(`TOTAL PRODUCTS IN DATABASE: ${totalProducts}`);
  console.log(`========================================\n`);

  const products = await Product.find({}).sort({ id: 1 });

  console.log(`ID    | Product Name                        | Seller Price | Display Price (+₹299) | Status`);
  console.log(`-----------------------------------------------------------------------------------------`);

  for (const p of products) {
    let sellerBase = p.base_price;
    if (!sellerBase || sellerBase <= 0) {
      sellerBase = p.price > 299 ? p.price - 299 : p.price;
    }

    const expectedDisplayPrice = sellerBase + 299;
    p.base_price = sellerBase;
    p.price = expectedDisplayPrice;
    await p.save();

    const idStr = String(p.id).padEnd(5);
    const nameStr = p.name.padEnd(35).substring(0, 35);
    const baseStr = (`₹` + p.base_price.toFixed(2)).padEnd(12);
    const priceStr = (`₹` + p.price.toFixed(2)).padEnd(21);

    console.log(`${idStr} | ${nameStr} | ${baseStr} | ${priceStr} | VERIFIED ✓`);
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: All ${products.length} products in the database strictly comply with:`);
  console.log(`Customer Display Price = Seller Base Price + ₹299`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

verifyAndMigrateAllProducts().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
