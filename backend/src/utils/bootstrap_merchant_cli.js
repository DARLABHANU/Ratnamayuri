const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';

const User = require('../models/User');
const MerchantProfile = require('../models/MerchantProfile');

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  let user = await User.findOne({ email: 'darlabhanumurthy@gmail.com' });
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Merchant@123!', salt);
    user = new User({
      email: 'darlabhanumurthy@gmail.com',
      hashed_password: hashedPassword,
      full_name: 'Darla Bhanu Murthy',
      role: 'merchant',
      account_number: 'RMMERCH0001',
      is_verified: true,
      is_first_login: false,
      is_active: true
    });
    await user.save();
    console.log('Created merchant user darlabhanumurthy@gmail.com (ID: ' + user.id + ')');
  } else {
    console.log('Merchant user darlabhanumurthy@gmail.com already exists (ID: ' + user.id + ')');
  }
  
  let profile = await MerchantProfile.findOne({ user_id: user.id });
  if (!profile) {
    profile = new MerchantProfile({
      user_id: user.id,
      business_name: 'Ratnamayuri Silks & Jewels',
      business_description: 'Premium heritage designer silks and fine jewellery',
      commission_rate: 10.0,
      is_approved: true
    });
    await profile.save();
    console.log('Created merchant profile successfully.');
  } else {
    console.log('Merchant profile already exists.');
  }
  
  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(err => {
  console.error('Error bootstrapping merchant:', err);
  process.exit(1);
});
