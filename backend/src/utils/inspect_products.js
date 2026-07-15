const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Product = require('../models/Product');

const inspect = async () => {
  const uri = "mongodb+srv://bhanuusr:Q7TS2QiesqiD7na9@cluster0.nji8mab.mongodb.net/ratnamayuri?appName=Cluster0";
  try {
    await mongoose.connect(uri);
    console.log('Connected to live DB');
    const products = await Product.find({});
    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
      console.log(`- ID: ${p.id}, Name: "${p.name}", Images: ${JSON.stringify(p.images)}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

inspect();
