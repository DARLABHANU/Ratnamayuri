const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';

async function updateExistingProducts() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected successfully.');

    const products = await Product.find({});
    console.log(`Found ${products.length} existing products in database.`);

    let updatedCount = 0;

    for (const prod of products) {
      const nameLower = prod.name ? prod.name.toLowerCase() : '';
      const descLower = prod.description ? prod.description.toLowerCase() : '';
      const combined = `${nameLower} ${descLower}`;

      const existingTags = Array.isArray(prod.tags) ? prod.tags : [];
      const tagSet = new Set(existingTags.map((t) => t.toLowerCase().trim()).filter(Boolean));

      // Infer tags based on keywords in name & description
      if (combined.includes('silk') || combined.includes('kanjivaram') || combined.includes('kanchipuram')) {
        tagSet.add('silk');
      }
      if (combined.includes('kanchipuram') || combined.includes('kanjivaram')) {
        tagSet.add('kanchipuram');
      }
      if (combined.includes('banarasi')) {
        tagSet.add('banarasi');
      }
      if (combined.includes('cotton')) {
        tagSet.add('cotton');
      }
      if (combined.includes('organza')) {
        tagSet.add('organza');
      }
      if (combined.includes('chanderi')) {
        tagSet.add('chanderi');
      }
      if (combined.includes('temple')) {
        tagSet.add('temple');
        tagSet.add('gold');
      }
      if (combined.includes('kundan')) {
        tagSet.add('kundan');
      }
      if (combined.includes('polki')) {
        tagSet.add('polki');
      }
      if (combined.includes('silver') || combined.includes('925')) {
        tagSet.add('silver 925');
      }
      if (combined.includes('bridal') || combined.includes('wedding')) {
        tagSet.add('bridal');
      }
      if (combined.includes('bangle') || combined.includes('kada')) {
        tagSet.add('bangles');
      }
      if (combined.includes('chain') || combined.includes('choker') || combined.includes('necklace')) {
        tagSet.add('jewellery');
      }
      if (combined.includes('saree')) {
        tagSet.add('sarees');
      }

      // Default fallback tag if none matched
      if (tagSet.size === 0) {
        tagSet.add('handloom');
        tagSet.add('exclusive');
      }

      const newTags = Array.from(tagSet);

      // Ensure default attributes exist if missing
      const defaultAttributes = prod.attributes || {
        material: combined.includes('silk') ? 'Pure Silk' : combined.includes('gold') ? '22K Gold Plated' : 'Traditional Weave',
        occasion: combined.includes('bridal') ? 'Wedding / Reception' : 'Festive & Ceremonial',
        style: combined.includes('kanchipuram') ? 'Kanchipuram Handloom' : combined.includes('temple') ? 'Temple Gold Nakshi' : 'Heritage Traditional',
      };

      prod.tags = newTags;
      if (!prod.attributes || Object.keys(prod.attributes).length === 0) {
        prod.attributes = defaultAttributes;
      }

      await prod.save();
      updatedCount++;
      console.log(`✓ Updated Product ID ${prod.id} ("${prod.name}") -> Tags: [${newTags.join(', ')}]`);
    }

    console.log(`\n🎉 Success! Successfully updated ${updatedCount} products with dynamic tags & attributes in MongoDB.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating existing products:', error);
    process.exit(1);
  }
}

updateExistingProducts();
