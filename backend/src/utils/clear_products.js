const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const Product = require('../models/Product');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const CartItem = require('../models/CartItem');

// We load Counter model from models folder
const CounterModel = require('../models/Counter');

const clearProducts = async () => {
  console.log('--- MongoDB Product Purge Tool ---');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';
  console.log('Target database URI:', uri);

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Delete all products
    const deleteProductsRes = await Product.deleteMany({});
    console.log(`🧹 Purged all products: ${deleteProductsRes.deletedCount} products deleted.`);

    // 2. Reset the Counter for product IDs so new products start at ID 1
    await CounterModel.deleteOne({ _id: 'productId' });
    console.log(`🧹 Reset product ID auto-increment counter.`);

    // 3. Clear reviews since they link to deleted products
    const deleteReviewsRes = await Review.deleteMany({});
    console.log(`🧹 Purged all product reviews: ${deleteReviewsRes.deletedCount} reviews deleted.`);

    // 4. Clear wishlists to prevent references to deleted products
    const deleteWishlistRes = await Wishlist.deleteMany({});
    console.log(`🧹 Purged all wishlists: ${deleteWishlistRes.deletedCount} wishlists deleted.`);

    // 5. Clear cart items referencing deleted products
    const deleteCartRes = await CartItem.deleteMany({});
    console.log(`🧹 Purged all cart items: ${deleteCartRes.deletedCount} cart items deleted.`);
    await CounterModel.deleteOne({ _id: 'cartItemId' });
    console.log(`🧹 Reset cart item ID auto-increment counter.`);

    console.log('\n✅ Product database purge completed successfully!');
  } catch (error) {
    console.error('❌ Failed to purge products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

clearProducts();
