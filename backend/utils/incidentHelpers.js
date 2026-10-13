const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const ApiError = require('./ApiError');

const sameId = (a, b) => !!a && !!b && String(a) === String(b);

/**
 * What `user` may do with `incident`.
 * Anonymous incidents have reporterId === null, so nobody is ever their "owner" server-side.
 */
function accessFor(user, incident) {
  const isOwner = sameId(incident.reporterId, user._id);
  const isAdmin = user.role === 'administrator';
  const isAssignee = user.role === 'staff' && sameId(incident.assignedTo, user._id);
  return {
    isOwner,
    isAdmin,
    isAssignee,
    canManage: isAdmin || isAssignee,
    canView: isOwner || isAdmin || isAssignee,
  };
}

/** Loads an incident by _id. Responds 404 (not 403) when the user cannot see it, so existence is not revealed. */
async function loadIncidentById(id, user, { requireManage = false } = {}) {
  const incident = await collections.incidents().findOne({ _id: new ObjectId(id) });
  if (!incident) throw new ApiError(404, 'Report not found.');
  const access = accessFor(user, incident);
  if (!access.canView) throw new ApiError(404, 'Report not found.');
  if (requireManage && !access.canManage) {
    throw new ApiError(403, 'You do not have permission to update this report.');
  }
  return { incident, access };
}

/** One entry of incident.timeline. `internal` entries are hidden from the reporter. */
function timelineEntry(actor, text, { status, internal = false } = {}) {
  return {
    _id: new ObjectId(),
    at: new Date(),
    actor: actor?.name || 'System',
    actorId: actor?._id ?? null,
    text,
    ...(status ? { status } : {}),
    internal: !!internal,
  };
}

module.exports = { sameId, accessFor, loadIncidentById, timelineEntry };
