const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Counter = require('../models/Counter');

const MONGODB_URI = 'mongodb://localhost:27017/ratnamayuri';

const demoReviews = [
  // Product 11: Royal Temple Gold Choker Set
  {
    product_id: 11,
    reviewer_email: 'priya.sharma@gmail.com',
    rating: 5,
    comment: 'Absolutely breathtaking! The choker has such a premium weight, and the temple gold plating looks exceptionally royal. The dispatch from Guntur warehouse was rapid, reaching me safely in Delhi under secure packaging. Very impressed!',
    images: []
  },
  {
    product_id: 11,
    reviewer_email: 'amit.verma@yahoo.com',
    rating: 4,
    comment: 'Beautiful heritage craftsmanship. The details on the choker design are clean. Shipped fully insured and arrived with secure OTP verification. High contrast finish looks stunning under lighting.',
    images: []
  },
  // Product 12: Kundan Polki Pearl Jhumkas
  {
    product_id: 12,
    reviewer_email: 'neha.reddy@gmail.com',
    rating: 5,
    comment: 'Stunning Polki artwork! They are light enough to wear for hours but look extremely grand. The pearls have a gorgeous heritage lustre. Shipped directly from Guntur and arrived with secure OTP handoff. High-quality purchase.',
    images: []
  },
  {
    product_id: 12,
    reviewer_email: 'priya.sharma@gmail.com',
    rating: 5,
    comment: 'Beautifully packed in velvet gift cases! Extremely delicate craftsmanship and authentic Kundan elements. Will definitely buy matching sets!',
    images: []
  },
  // Product 13: Nakshi Antique Gold Kada
  {
    product_id: 13,
    reviewer_email: 'amit.verma@yahoo.com',
    rating: 5,
    comment: 'Exceptional details on the Kada. The Nakshi antique finish is brilliant and looks incredibly premium. Highly recommend Ratnamayuri for authentic Indian art pieces.',
    images: []
  },
  // Product 18: Royal Emerald Kanjivaram Silk Saree
  {
    product_id: 18,
    reviewer_email: 'neha.reddy@gmail.com',
    rating: 5,
    comment: 'Extraordinary silk texture! The royal emerald green shade is extremely deep and has a gorgeous luxury shine. The handloom weave has zero discrepancies. Shipped in safe heirloom boxes under full transit insurance. A true masterpiece!',
    images: []
  },
  {
    product_id: 18,
    reviewer_email: 'priya.sharma@gmail.com',
    rating: 5,
    comment: 'Purchased this Kanjivaram for a wedding. High-contrast zari border and heavy drape. Excellent support and rapid Guntur godown dispatch.',
    images: []
  }
];

async function seedReviews() {
  console.log('[Demo Reviews Seeder] Connecting to database...');
  await mongoose.connect(MONGODB_URI);

  try {
    // 1. Clear any existing reviews to prevent duplicates during seeding
    await Review.deleteMany({});
    await Counter.updateOne({ _id: 'reviewId' }, { $set: { seq: 0 } }, { upsert: true });
    console.log('[Demo Reviews Seeder] Cleaned existing reviews collection.');

    // 2. Fetch users to map email to user_id
    const users = await User.find({});
    const userMap = new Map(users.map(u => [u.email, u]));

    let seededCount = 0;

    for (const rData of demoReviews) {
      const user = userMap.get(rData.reviewer_email);
      if (!user) {
        console.warn(`[Warning] User with email ${rData.reviewer_email} not found. Skipping review.`);
        continue;
      }

      // Check if product exists
      const product = await Product.findOne({ id: rData.product_id });
      if (!product) {
        console.warn(`[Warning] Product with ID ${rData.product_id} not found. Skipping review.`);
        continue;
      }

      const reviewCounter = await Counter.findByIdAndUpdate(
        'reviewId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const review = new Review({
        id: reviewCounter.seq,
        product_id: rData.product_id,
        user_id: user.id,
        rating: rData.rating,
        comment: rData.comment,
        images: rData.images
      });

      await review.save();
      seededCount++;
    }

    console.log(`[Demo Reviews Seeder] Seeded ${seededCount} reviews successfully!`);

    // 3. Recalculate average rating & rating count on all products that received reviews
    const uniqueProductIds = [...new Set(demoReviews.map(r => r.product_id))];
    console.log('[Demo Reviews Seeder] Recalculating ratings for products:', uniqueProductIds);

    for (const prodId of uniqueProductIds) {
      const product = await Product.findOne({ id: prodId });
      if (!product) continue;

      const productReviews = await Review.find({ product_id: prodId });
      const count = productReviews.length;
      const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / count;

      product.rating_count = count;
      product.rating_avg = Math.round(avg * 10) / 10;
      await product.save();

      console.log(`[Demo Reviews Seeder] Product #${product.id} ("${product.name}") updated: ${product.rating_avg} stars / ${product.rating_count} reviews.`);
    }

    console.log('[Demo Reviews Seeder] Database updates completed successfully!');
  } catch (err) {
    console.error('[Demo Reviews Seeder] Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Demo Reviews Seeder] Disconnected from database.');
  }
}

seedReviews();
