const cron = require('node-cron');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MerchantProfile = require('../models/MerchantProfile');
const AuditLog = require('../models/AuditLog');

// Background task to enforce Seller SLA (hourly checker)
const initSLAScheduler = () => {
  // Run every hour: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    console.log('[SLA Cron] Scanning for pending orders exceeding 24 hours...');
    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(now.getHours() - 24); // 24 hours ago

      // Find all orders in 'pending' status created older than the 24 hour cutoff
      const expiredOrders = await Order.find({
        status: 'pending',
        created_at: { $lte: cutoff }
      });

      if (expiredOrders.length === 0) {
        console.log('[SLA Cron] No expired pending orders found.');
        return;
      }

      console.log(`[SLA Cron] Found ${expiredOrders.length} expired orders. Initiating automatic cancellation...`);

      for (const order of expiredOrders) {
        // Update order status to cancelled
        order.status = 'cancelled';
        order.status_history.push({
          status: 'cancelled',
          changed_by: 'system_sla',
          timestamp: new Date(),
          comment: 'Automatically cancelled by System SLA due to no merchant response within 24 hours.'
        });
        await order.save();

        console.log(`[SLA Cron] Cancelled Order #${order.order_number}`);

        // Find all unique merchant profiles associated with this order's items
        const orderItems = await OrderItem.find({ order_id: order.id });
        const merchantIds = [...new Set(orderItems.map(item => item.merchant_id))];

        for (const merchantId of merchantIds) {
          // Subtract -5 performance points from each merchant's profile
          const profile = await MerchantProfile.findOne({ id: merchantId });
          if (profile) {
            profile.performance_points = Math.max(0, (profile.performance_points || 100) - 5);
            await profile.save();
            console.log(`[SLA Cron] Deducted 5 performance points from Merchant Profile #${merchantId}. New balance: ${profile.performance_points}`);

            // Log an audit record for merchant SLA penalty
            const audit = new AuditLog({
              action_type: 'merchant_sla_penalty',
              actor_id: 0, // system
              actor_email: 'system_sla@ratnamayuri.live',
              target_id: merchantId,
              target_type: 'MerchantProfile',
              details: `Auto-cancellation penalty of -5 points applied for failing to process Order #${order.order_number} within 24 hours.`,
              timestamp: new Date()
            });
            await audit.save();
          }
        }
      }
    } catch (error) {
      console.error('[SLA Cron Error] Failed to run SLA scheduler check:', error);
    }
  });

  // Run every hour: '5 * * * *' (5 minutes past each hour to disperse load)
  cron.schedule('5 * * * *', async () => {
    console.log('[Escrow Cron] Scanning for matured settlements to release...');
    try {
      const Settlement = require('../models/Settlement');
      const Wallet = require('../models/Wallet');
      const AuditLog = require('../models/AuditLog');

      const now = new Date();

      // Find settlements on escrow_hold where release_date is in the past
      const maturedSettlements = await Settlement.find({
        status: 'escrow_hold',
        release_date: { $lte: now }
      });

      if (maturedSettlements.length === 0) {
        console.log('[Escrow Cron] No matured settlements to release.');
        return;
      }

      console.log(`[Escrow Cron] Found ${maturedSettlements.length} matured settlements. Releasing funds...`);

      for (const settlement of maturedSettlements) {
        settlement.status = 'released';
        settlement.updated_at = new Date();
        await settlement.save();

        // Release funds from merchant's pending balance to available balance
        let wallet = await Wallet.findOne({ merchant_id: settlement.merchant_id });
        if (!wallet) {
          wallet = new Wallet({ merchant_id: settlement.merchant_id });
        }
        
        wallet.pending_balance = Number(Math.max(0, (wallet.pending_balance || 0) - settlement.amount).toFixed(2));
        wallet.available_balance = Number(((wallet.available_balance || 0) + settlement.amount).toFixed(2));
        await wallet.save();

        console.log(`[Escrow Cron] Released ₹${settlement.amount} to Merchant Profile #${settlement.merchant_id} (Settlement ID: ${settlement.id})`);

        // Audit log
        const audit = new AuditLog({
          action_type: 'escrow_release',
          actor_id: 0,
          actor_email: 'escrow_scheduler@ratnamayuri.live',
          target_id: settlement.id,
          target_type: 'Settlement',
          details: `Escrow hold release for ₹${settlement.amount} successfully transferred to Merchant available balance.`,
          timestamp: new Date()
        });
        await audit.save();
      }
    } catch (error) {
      console.error('[Escrow Cron Error] Failed to process matured escrow releases:', error);
    }
  });

  console.log('[SLA Service] Chronological Seller SLA Cron Scheduler successfully initialized!');
  console.log('[Escrow Service] Chronological Escrow Holding Balance Cron Scheduler initialized!');
};

module.exports = { initSLAScheduler };
