const mongoose = require('mongoose');
const Counter = require('./Counter');

const AuditLogSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  performed_by: { type: Number, required: true, ref: 'User', index: true },
  target_user_id: { type: Number, ref: 'User', default: null, index: true },
  action: {
    type: String,
    enum: ['impersonation_start', 'impersonation_end', 'view_account', 'update_account', 'update_order', 'reset_password'],
    required: true
  },
  description: { type: String, default: null },
  ip_address: { type: String, default: null },
  user_agent: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now }
});

// Auto-increment sequence hook
AuditLogSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'auditLogId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;
