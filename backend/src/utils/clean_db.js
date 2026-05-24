const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const cleanDatabase = async () => {
  console.log('--- MongoDB Database Purge & Clean Tool ---');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';
  console.log('Target database URI:', uri);

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully.');

    // Fetch the User schema dynamically to prevent import conflicts
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const OTPCode = mongoose.model('OTPCode', new mongoose.Schema({}, { strict: false }));

    console.log('\nScanning for conflicting user accounts...');
    
    // 1. Delete users with phone "6304139967"
    const deletePhoneRes = await User.deleteMany({ phone: '6304139967' });
    console.log(`🧹 Deleted users with phone number '6304139967': ${deletePhoneRes.deletedCount} accounts.`);

    // 2. Delete users with empty phone strings ""
    const deleteEmptyPhoneRes = await User.deleteMany({ phone: '' });
    console.log(`🧹 Deleted users with blank/empty phone strings: ${deleteEmptyPhoneRes.deletedCount} accounts.`);

    // 3. Purge related OTP verification records to keep database clean
    const deleteOtpRes = await OTPCode.deleteMany({});
    console.log(`🧹 Purged all temporary OTP verification records: ${deleteOtpRes.deletedCount} items.`);

    console.log('\n✅ Database clean up COMPLETED successfully!');
  } catch (error) {
    console.error('❌ Failed to clean up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

cleanDatabase();
