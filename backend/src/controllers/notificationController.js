const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ recipient_id: req.user.id, is_read: false });
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'all') {
      await Notification.updateMany(
        { recipient_id: req.user.id, is_read: false },
        { $set: { is_read: true } }
      );
    } else {
      await Notification.findOneAndUpdate(
        { _id: id, recipient_id: req.user.id },
        { $set: { is_read: true } }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
};
