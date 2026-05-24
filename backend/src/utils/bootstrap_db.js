const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');
const Counter = require('../models/Counter');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';

async function bootstrap() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB successfully!');

  // 1. Seed categories
  const defaultCategories = [
    { name: 'Luxury Jewellery', slug: 'jewellery', sort_order: 1 },
    { name: 'Silk Sarees', slug: 'sarees', sort_order: 2 },
    { name: 'Bridal', slug: 'bridal', sort_order: 3 }
  ];

  for (const cat of defaultCategories) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      const newCat = new Category(cat);
      await newCat.save();
      console.log(`Seeded category: ${cat.name}`);
    } else {
      console.log(`Category already exists: ${cat.name}`);
    }
  }

  // 2. Fetch all categories to get their generated IDs
  const jewelleryCat = await Category.findOne({ slug: 'jewellery' });
  const sareesCat = await Category.findOne({ slug: 'sarees' });
  const bridalCat = await Category.findOne({ slug: 'bridal' });

  console.log(`Fetched category IDs -> Jewellery: ${jewelleryCat.id}, Sarees: ${sareesCat.id}, Bridal: ${bridalCat.id}`);

  // 3. Update existing products to assign their correct category_id
  const updateResults = [];

  // Update "saree 2"
  const saree2Result = await Product.updateMany(
    { name: { $regex: /saree\s*2/i } },
    { $set: { category_id: sareesCat.id } }
  );
  updateResults.push({ name: 'saree 2', modified: saree2Result.modifiedCount });

  // Update "saree"
  const sareeResult = await Product.updateMany(
    { name: 'saree' },
    { $set: { category_id: sareesCat.id } }
  );
  updateResults.push({ name: 'saree', modified: sareeResult.modifiedCount });

  // Update "necklace"
  const necklaceResult = await Product.updateMany(
    { name: { $regex: /necklace/i } },
    { $set: { category_id: jewelleryCat.id } }
  );
  updateResults.push({ name: 'necklace', modified: necklaceResult.modifiedCount });

  console.log('Database updates completed:', updateResults);
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

bootstrap().catch(err => {
  console.error('Error during database bootstrap:', err);
  process.exit(1);
});
