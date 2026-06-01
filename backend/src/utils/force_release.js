const connectDB = require('../config/db');
const Settlement = require('../models/Settlement');
const mongoose = require('mongoose');

async function run() {
  try {
    console.log('[Utility] Connecting to MongoDB...');
    await connectDB();
    
    const now = new Date();
    const pastDate = new Date();
    pastDate.setMinutes(now.getMinutes() - 30); // 30 minutes in the past
    
    // Find all settlements that are currently locked
    const pendingSettlements = await Settlement.find({ status: 'escrow_hold' });
    console.log(`[Utility] Found ${pendingSettlements.length} active escrow holdings.`);

    const result = await Settlement.updateMany(
      { status: 'escrow_hold' },
      { $set: { release_date: pastDate } }
    );
    
    console.log(`[Utility] Successfully updated ${result.modifiedCount} settlements to a past date!`);
    console.log('[Utility] The 10-second cron scheduler will now release these funds immediately.');
  } catch (err) {
    console.error('[Utility Error] Failed to force release settlements:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Utility] Disconnected from MongoDB.');
    process.exit(0);
  }
}

run();
