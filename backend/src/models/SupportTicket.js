const mongoose = require('mongoose');
const Counter = require('./Counter');

const ReplySchema = new mongoose.Schema({
  sender_id: { type: Number, required: true },
  sender_name: { type: String, required: true },
  sender_role: { type: String, enum: ['customer', 'support', 'admin'], required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const SupportTicketSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, ref: 'User', index: true },
  subject: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['order_help', 'payment', 'refund', 'general_inquiry'], 
    required: true,
    index: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium',
    index: true
  },
  order_id: { type: Number, ref: 'Order', default: null },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved'], 
    default: 'open',
    index: true
  },
  replies: [ReplySchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook for ticketId
SupportTicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'ticketId',
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

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

module.exports = SupportTicket;
