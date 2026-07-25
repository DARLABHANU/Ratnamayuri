const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Category = require('../models/Category');

const connectDB = require('../config/db');

async function migrateSubcategories() {
  try {
    console.log('Connecting to MongoDB Atlas for Subcategory Taxonomy Migration...');
    await connectDB();
    console.log('MongoDB Connected successfully.');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to classify.`);

    let updatedCount = 0;

    for (const prod of products) {
      const name = prod.name ? prod.name.toLowerCase() : '';
      const desc = prod.description ? prod.description.toLowerCase() : '';
      const tagsList = Array.isArray(prod.tags) ? prod.tags.map(t => t.toLowerCase()) : [];
      const combined = `${name} ${desc} ${tagsList.join(' ')}`;

      let assignedSubcategory = 'Jewellery';

      // Precise Taxonomy Mapping Logic
      if (combined.includes('bangle') || combined.includes('kada') || combined.includes('bracelet')) {
        assignedSubcategory = 'Bangles';
      } else if (combined.includes('earring') || combined.includes('jhumka') || combined.includes('stud')) {
        assignedSubcategory = 'Earrings';
      } else if (combined.includes('choker') || combined.includes('necklace') || combined.includes('haram') || combined.includes('neckset')) {
        assignedSubcategory = 'Necklaces';
      } else if (combined.includes('chain')) {
        assignedSubcategory = 'Chains';
      } else if (combined.includes('ring')) {
        assignedSubcategory = 'Rings';
      } else if (combined.includes('anklet')) {
        assignedSubcategory = 'Anklets';
      } else if (combined.includes('pendant')) {
        assignedSubcategory = 'Pendants';
      } else if (combined.includes('bridal set') || combined.includes('bridal jewellery')) {
        assignedSubcategory = 'Bridal Jewellery';
      } else if (combined.includes('kanchipuram') || combined.includes('kanjeevaram')) {
        assignedSubcategory = 'Kanchipuram Sarees';
      } else if (combined.includes('banarasi')) {
        assignedSubcategory = 'Banarasi Sarees';
      } else if (combined.includes('cotton saree')) {
        assignedSubcategory = 'Cotton Sarees';
      } else if (combined.includes('silk saree')) {
        assignedSubcategory = 'Silk Sarees';
      } else if (combined.includes('saree')) {
        assignedSubcategory = 'Silk Sarees';
      }

      const subSlug = assignedSubcategory.toLowerCase().replace(/\s+/g, '-');

      // Update product fields
      prod.subcategory = assignedSubcategory;
      prod.subcategory_slug = subSlug;

      // Ensure tags list contains the exact subcategory & cleaned tags
      const currentTags = new Set(Array.isArray(prod.tags) ? prod.tags : []);
      currentTags.add(assignedSubcategory);
      currentTags.add(assignedSubcategory.toLowerCase());
      
      prod.tags = Array.from(currentTags);

      await prod.save();
      updatedCount++;
      console.log(`✓ Classified Product #${prod.id} ("${prod.name}") -> Subcategory: "${assignedSubcategory}" | Tags: [${prod.tags.join(', ')}]`);
    }

    console.log(`\n🎉 Success! Successfully migrated and classified ${updatedCount} products into precise subcategories in MongoDB.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during subcategory migration:', error);
    process.exit(1);
  }
}

migrateSubcategories();
