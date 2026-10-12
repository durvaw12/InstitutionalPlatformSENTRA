const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { RESPONSE_TYPES } = require('../utils/constants');
const { loadIncidentById, timelineEntry } = require('../utils/incidentHelpers');
const { notifyUsers } = require('../utils/notify');
const { serializeResponses } = require('../utils/serializers');
const { asString, parseBool } = require('../utils/validators');

/**
 * Stores a response and mirrors it on the incident timeline.
 * A `resolution` also moves the incident to Resolved. Returns the response document and updated incident.
 * Shared with incidentController.updateStatus.
 */
async function recordResponse({ incident, author, type, message, isInternal }) {
  const now = new Date();
  const response = { _id: new ObjectId(), incidentId: incident._id, authorId: author._id, type, message, isInternal: !!isInternal, createdAt: now };
  await collections.responses().insertOne(response);

  const entries = [];
  const set = { updatedAt: now };
  if (type === 'resolution' && incident.status !== 'Resolved') {
    set.status = 'Resolved';
    set.resolvedAt = now;
    entries.push(timelineEntry(author, 'Status changed to Resolved', { status: 'Resolved' }));
  }
  entries.push(timelineEntry(author, message, { internal: isInternal }));

  await collections.incidents().updateOne({ _id: incident._id }, { $set: set, $push: { timeline: { $each: entries } } });
  return { response, statusChanged: set.status === 'Resolved' };
}

// POST /api/incidents/:id/responses   { message, type?, isInternal? }
const addResponse = asyncHandler(async (req, res) => {
  const { incident } = await loadIncidentById(req.params.id, req.user, { requireManage: true });
  const body = req.body || {};
  const admin = req.user.role === 'administrator';

  const message = asString(body.message);
  if (!message) throw new ApiError(400, 'Enter a message.', { field: 'message' });
  if (message.length > 2000) throw new ApiError(400, 'Keep the message under 2000 characters.', { field: 'message' });

  let type = admin ? 'admin_remark' : 'staff_response';
  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !RESPONSE_TYPES.includes(body.type)) {
      throw new ApiError(400, `type must be one of: ${RESPONSE_TYPES.join(', ')}.`, { field: 'type' });
    }
    if (body.type === 'admin_remark' && !admin) throw new ApiError(403, 'Only administrators can add administrator remarks.');
    if (body.type === 'staff_response' && admin) throw new ApiError(403, 'Administrators post remarks or resolutions, not staff responses.');
    type = body.type;
  }

  const isInternal = parseBool(body.isInternal ?? body.internal);
  if (type === 'resolution' && isInternal) {
    throw new ApiError(400, 'Add a public note explaining the outcome before resolving.', { field: 'message' });
  }

  const { response, statusChanged } = await recordResponse({ incident, author: req.user, type, message, isInternal });

  // Alerts: the reporter (unless the note is internal or the report is anonymous) and the assignee.
  const resolved = type === 'resolution';
  const base = { incidentId: incident._id, referenceId: incident.referenceId };
  if (!isInternal) {
    await notifyUsers([incident.reporterId], {
      ...base,
      type: resolved ? 'resolution' : 'response',
      title: resolved ? 'Report resolved' : 'New update on your report',
      message: resolved ? `Report ${incident.referenceId} was resolved.` : `New update on report ${incident.referenceId}.`,
    }, { exclude: req.user._id });
  }
  await notifyUsers([incident.assignedTo], {
    ...base,
    type: resolved ? 'resolution' : 'response',
    title: resolved ? 'Report resolved' : 'New note on an assigned report',
    message: resolved
      ? `Report ${incident.referenceId} was resolved.`
      : `${req.user.name} added ${isInternal ? 'an internal note' : 'a response'} on report ${incident.referenceId}.`,
  }, { exclude: req.user._id });

  const [shaped] = await serializeResponses([response], req.user);
  res.status(201).json({ success: true, response: shaped, statusChanged });
});

// GET /api/incidents/:id/responses
const listResponses = asyncHandler(async (req, res) => {
  const { access } = await loadIncidentById(req.params.id, req.user);
  const filter = { incidentId: new ObjectId(req.params.id) };
  if (!access.canManage) filter.isInternal = { $ne: true }; // reporters never see internal notes
  const responses = await collections.responses().find(filter).sort({ createdAt: 1 }).toArray();
  res.json({ success: true, responses: await serializeResponses(responses, req.user) });
});

module.exports = { addResponse, listResponses, recordResponse };
