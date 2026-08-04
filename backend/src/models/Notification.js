const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: { type: Number, required: true }, // The merchant or user ID
  type: { type: String, enum: ['order', 'review', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_id: { type: Number }, // Could be order_id or review_id
  is_read: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Notification', notificationSchema);
