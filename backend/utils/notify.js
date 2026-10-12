const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');

/**
 * Inserts one notification per recipient. Never throws: a failed alert must not fail the action that caused it.
 * @param {Array<ObjectId|string|null>} userIds recipients (nulls and duplicates are dropped)
 * @param {{incidentId: ObjectId, referenceId: string, type: string, title: string, message: string}} payload
 * @param {{exclude?: ObjectId|string}} [opts] usually the acting user, who does not need an alert for their own action
 */
async function notifyUsers(userIds, payload, { exclude } = {}) {
  try {
    const skip = exclude ? String(exclude) : null;
    const unique = [...new Set((userIds || []).filter(Boolean).map(String))].filter((id) => id !== skip);
    if (!unique.length) return 0;
    const createdAt = new Date();
    const docs = unique.map((id) => ({
      userId: new ObjectId(id),
      incidentId: payload.incidentId,
      referenceId: payload.referenceId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      isRead: false,
      createdAt,
    }));
    await collections.notifications().insertMany(docs);
    return docs.length;
  } catch (err) {
    console.error('Failed to dispatch notifications:', err.message);
    return 0;
  }
}

async function getActiveAdminIds() {
  const admins = await collections
    .users()
    .find({ role: 'administrator', isActive: true }, { projection: { _id: 1 } })
    .toArray();
  return admins.map((a) => a._id);
}

module.exports = { notifyUsers, getActiveAdminIds };
