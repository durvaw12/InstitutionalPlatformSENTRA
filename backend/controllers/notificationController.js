const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { serializeNotification } = require('../utils/serializers');

// GET /api/notifications  ?unread=true &limit=
const listNotifications = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);

  const [items, unreadCount] = await Promise.all([
    collections.notifications().find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
    collections.notifications().countDocuments({ userId: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, unreadCount, notifications: items.map(serializeNotification) });
});

// PATCH /api/notifications/:id/read  (own notifications only)
const markRead = asyncHandler(async (req, res) => {
  const updated = await collections
    .notifications()
    .findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.user._id },
      { $set: { isRead: true } },
      { returnDocument: 'after' },
    );
  if (!updated) throw new ApiError(404, 'Notification not found.');
  res.json({ success: true, notification: serializeNotification(updated) });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  const result = await collections.notifications().updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, updated: result.modifiedCount });
});

module.exports = { listNotifications, markRead, markAllRead };
