const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../utils/constants');
const generateReferenceId = require('../utils/generateReferenceId');
const { uploadFiles, destroyByUrls } = require('../utils/cloudinaryUpload');
const { accessFor, loadIncidentById, sameId, timelineEntry } = require('../utils/incidentHelpers');
const { getActiveAdminIds, notifyUsers } = require('../utils/notify');
const { serializeIncident, serializeIncidents, serializeTracking } = require('../utils/serializers');
const { asString, escapeRegex, isObjectIdString, parseBool, validationError } = require('../utils/validators');
const { recordResponse } = require('./responseController');

/* ---------------------------------- create --------------------------------- */

// POST /api/incidents   (multipart/form-data or JSON; files in "attachments" or "attachment")
const createIncident = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = {};

  const category = asString(body.category);
  const location = asString(body.location);
  const description = asString(body.description);
  // The frontend form calls this field "anonymous"; the schema calls it isAnonymous. Both are accepted.
  const anonymous = parseBool(body.isAnonymous ?? body.anonymous);

  if (!CATEGORIES.includes(category)) errors.category = 'Choose a category.';
  if (location.length < 3) errors.location = 'Describe where it happened (at least 3 characters).';
  else if (location.length > 200) errors.location = 'Keep the location under 200 characters.';
  if (description.length < 20) errors.description = 'Describe what happened in at least 20 characters.';
  else if (description.length > 2000) errors.description = 'Keep the description under 2000 characters.';

  let occurredAt = new Date();
  if (body.occurredAt !== undefined && body.occurredAt !== '') {
    occurredAt = new Date(asString(body.occurredAt));
    if (Number.isNaN(occurredAt.getTime())) errors.occurredAt = 'Enter when it happened.';
    else if (occurredAt.getTime() > Date.now() + 5 * 60 * 1000) errors.occurredAt = 'The date and time cannot be in the future.';
  }
  if (Object.keys(errors).length) throw validationError(errors);

  const attachments = await uploadFiles(req.uploadedFiles || []);

  const now = new Date();
  const referenceId = await generateReferenceId();
  const submitter = anonymous ? { _id: null, name: 'Anonymous reporter' } : req.user;
  const doc = {
    referenceId,
    // Anonymous: the reporter's id is never written to the database.
    reporterId: anonymous ? null : req.user._id,
    isAnonymous: anonymous,
    category,
    location,
    description,
    occurredAt,
    priority: 'Medium',
    status: 'Pending',
    assignedTo: null,
    assignedDepartment: null,
    assignedBy: null,
    attachments,
    timeline: [timelineEntry(submitter, 'Report submitted', { status: 'Pending' })],
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { insertedId } = await collections.incidents().insertOne(doc);
    doc._id = insertedId;
  } catch (err) {
    await destroyByUrls(attachments);
    throw err;
  }

  const base = { incidentId: doc._id, referenceId };
  const adminIds = await getActiveAdminIds();
  await notifyUsers(adminIds, {
    ...base,
    type: 'incident_created',
    title: 'New report needs review',
    message: `New ${category.toLowerCase()} report ${referenceId} needs review.`,
  }, { exclude: req.user._id });
  if (!anonymous) {
    await notifyUsers([req.user._id], {
      ...base,
      type: 'incident_received',
      title: 'Report received',
      message: `Report ${referenceId} received. Keep this reference ID to track it.`,
    });
  }

  res.status(201).json({
    success: true,
    referenceId,
    incident: await serializeIncident(doc, req.user, { asSubmitter: true }),
  });
});

/* ----------------------------------- lists --------------------------------- */

const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/** Builds a Mongo filter from ?status &priority &category &assignee &assignedDepartment &open &q. Every value must be a plain string. */
function buildFilter(query, base = {}, { allowAssignee = false } = {}) {
  const and = [];
  const str = (key) => {
    const v = query[key];
    if (v === undefined || v === '') return undefined;
    if (typeof v !== 'string') throw new ApiError(400, `Invalid ${key} filter.`);
    return v.trim();
  };

  const status = str('status');
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new ApiError(400, 'Invalid status filter.');
    and.push({ status });
  }
  const priority = str('priority');
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) throw new ApiError(400, 'Invalid priority filter.');
    and.push({ priority });
  }
  const category = str('category');
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) throw new ApiError(400, 'Invalid category filter.');
    and.push({ category });
  }
  const open = str('open');
  if (open === '1' || open === 'true') and.push({ status: { $ne: 'Resolved' } });

  if (allowAssignee) {
    const assignee = str('assignee');
    if (assignee === 'none') and.push({ assignedTo: null });
    else if (assignee !== undefined) {
      if (!isObjectIdString(assignee)) throw new ApiError(400, 'Invalid assignee filter.');
      and.push({ assignedTo: new ObjectId(assignee) });
    }
    const dept = str('assignedDepartment');
    if (dept !== undefined) and.push({ assignedDepartment: dept });
  }

  const q = str('q');
  if (q) {
    const rx = new RegExp(escapeRegex(q.slice(0, 100)), 'i');
    and.push({ $or: [{ referenceId: rx }, { location: rx }, { description: rx }, { category: rx }] });
  }
  return and.length ? { ...base, $and: and } : { ...base };
}

async function runList(req, res, baseFilter, opts) {
  const filter = buildFilter(req.query, baseFilter, opts);
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'updated';
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 1000);

  const sortStages = {
    updated: [{ $sort: { updatedAt: -1 } }],
    oldest: [{ $sort: { createdAt: 1 } }],
    newest: [{ $sort: { createdAt: -1 } }],
    priority: [
      {
        $addFields: {
          _rank: {
            $switch: {
              branches: Object.entries(PRIORITY_RANK).map(([p, n]) => ({ case: { $eq: ['$priority', p] }, then: n })),
              default: 0,
            },
          },
        },
      },
      { $sort: { _rank: -1, updatedAt: -1 } },
    ],
  };
  if (!sortStages[sort]) throw new ApiError(400, 'sort must be one of: updated, oldest, newest, priority.');

  const [rows, total] = await Promise.all([
    collections
      .incidents()
      .aggregate([
        { $match: filter },
        ...sortStages[sort],
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _rank: 0, timeline: 0 } },
      ])
      .toArray(),
    collections.incidents().countDocuments(filter),
  ]);

  res.json({ success: true, total, page, limit, incidents: await serializeIncidents(rows, req.user, { withTimeline: false }) });
}

// GET /api/incidents  (administrator)
const listIncidents = asyncHandler((req, res) => runList(req, res, {}, { allowAssignee: true }));

// GET /api/incidents/my  — anonymous reports have reporterId null, so they can never appear here
const getMyIncidents = asyncHandler((req, res) => runList(req, res, { reporterId: req.user._id }));

// GET /api/incidents/assigned
const getAssignedIncidents = asyncHandler((req, res) => runList(req, res, { assignedTo: req.user._id }));

/* ----------------------------------- reads --------------------------------- */

// GET /api/incidents/:id
const getIncidentById = asyncHandler(async (req, res) => {
  const { incident } = await loadIncidentById(req.params.id, req.user);
  res.json({ success: true, incident: await serializeIncident(incident, req.user) });
});

// GET /api/incidents/reference/:referenceId
// Owner / assignee / administrator get the full report. Anyone else who knows the reference of an ANONYMOUS
// report (its submitter has no account link, so this is how they follow it) gets a status-only tracking view.
const getIncidentByReference = asyncHandler(async (req, res) => {
  const incident = await collections.incidents().findOne({ referenceId: req.params.referenceId.toUpperCase() });
  if (!incident) throw new ApiError(404, 'Report not found.');
  if (accessFor(req.user, incident).canView) {
    return res.json({ success: true, incident: await serializeIncident(incident, req.user) });
  }
  if (incident.isAnonymous) return res.json({ success: true, incident: serializeTracking(incident) });
  throw new ApiError(404, 'Report not found.');
});

/* ---------------------------------- updates -------------------------------- */

// PATCH /api/incidents/:id/status   { status?, note?, isInternal? }   administrator or the assigned staff member
const updateStatus = asyncHandler(async (req, res) => {
  const { incident } = await loadIncidentById(req.params.id, req.user, { requireManage: true });
  const body = req.body || {};

  let status = incident.status;
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status)) {
      throw new ApiError(400, `status must be one of: ${STATUSES.join(', ')}.`, { field: 'status' });
    }
    status = body.status;
  }
  const note = asString(body.note ?? body.message);
  const isInternal = parseBool(body.isInternal ?? body.internal);
  if (note.length > 2000) throw new ApiError(400, 'Keep the note under 2000 characters.', { field: 'note' });

  const changed = status !== incident.status;
  if (!changed && !note) throw new ApiError(400, 'There are no changes to save.');
  if (changed && status === 'Resolved' && (!note || isInternal)) {
    throw new ApiError(400, 'Add a public note explaining the outcome before resolving.', { field: 'note' });
  }

  const now = new Date();
  const base = { incidentId: incident._id, referenceId: incident.referenceId };

  if (changed && status === 'Resolved') {
    // Same code path as POST /responses with type "resolution".
    await recordResponse({ incident, author: req.user, type: 'resolution', message: note, isInternal: false });
  } else {
    const entries = [];
    const set = { updatedAt: now };
    if (changed) {
      set.status = status;
      set.resolvedAt = null; // reopened
      entries.push(timelineEntry(req.user, `Status changed to ${status}`, { status }));
    }
    if (note) {
      const type = req.user.role === 'administrator' ? 'admin_remark' : 'staff_response';
      await collections.responses().insertOne({ incidentId: incident._id, authorId: req.user._id, type, message: note, isInternal, createdAt: now });
      entries.push(timelineEntry(req.user, note, { internal: isInternal }));
    }
    await collections.incidents().updateOne({ _id: incident._id }, { $set: set, $push: { timeline: { $each: entries } } });
  }

  // Alerts
  if (changed) {
    const resolved = status === 'Resolved';
    const type = resolved ? 'resolution' : 'status_changed';
    const title = resolved ? 'Report resolved' : 'Report status updated';
    await notifyUsers([incident.reporterId], {
      ...base, type, title,
      message: resolved ? `Report ${incident.referenceId} was resolved.` : `Report ${incident.referenceId} is now ${status}.`,
    }, { exclude: req.user._id });
    await notifyUsers([incident.assignedTo], {
      ...base, type, title,
      message: `Report ${incident.referenceId} is now ${status}.`,
    }, { exclude: req.user._id });
  } else if (note && !isInternal) {
    await notifyUsers([incident.reporterId, incident.assignedTo], {
      ...base, type: 'response', title: 'New update on a report', message: `New update on report ${incident.referenceId}.`,
    }, { exclude: req.user._id });
  } else if (note && isInternal) {
    await notifyUsers([incident.assignedTo], {
      ...base, type: 'response', title: 'Internal note added', message: `An internal note was added to report ${incident.referenceId}.`,
    }, { exclude: req.user._id });
  }

  const updated = await collections.incidents().findOne({ _id: incident._id });
  res.json({ success: true, incident: await serializeIncident(updated, req.user) });
});

// PATCH /api/incidents/:id/assignment   (administrator)
// { assignedTo?: userId|null, assignedDepartment?: string|null }
// Assigning a person defaults the department to theirs. Sending only assignedDepartment routes the report to a
// department without naming a person. assignedTo: null removes the assignment (and clears the department unless one is sent).
const updateAssignment = asyncHandler(async (req, res) => {
  const { incident } = await loadIncidentById(req.params.id, req.user, { requireManage: true });
  const body = req.body || {};
  const hasAssignee = Object.prototype.hasOwnProperty.call(body, 'assignedTo');
  const hasDept = Object.prototype.hasOwnProperty.call(body, 'assignedDepartment');

  if (!hasAssignee && !hasDept) throw new ApiError(400, 'Send assignedTo and/or assignedDepartment.');
  if (incident.status === 'Resolved') throw new ApiError(400, 'Resolved reports cannot be reassigned.');

  let nextAssignee = incident.assignedTo ?? null;
  let assigneeDoc = null;
  if (hasAssignee) {
    if (body.assignedTo === null || body.assignedTo === '') nextAssignee = null;
    else {
      if (!isObjectIdString(body.assignedTo)) throw new ApiError(400, 'Invalid assignedTo id.', { field: 'assignedTo' });
      assigneeDoc = await collections
        .users()
        .findOne({ _id: new ObjectId(body.assignedTo), isActive: true, role: { $in: ['staff', 'administrator'] } }, { projection: { name: 1, department: 1 } });
      if (!assigneeDoc) throw new ApiError(400, 'That handler is no longer available.', { field: 'assignedTo' });
      nextAssignee = assigneeDoc._id;
    }
  } else if (nextAssignee) {
    assigneeDoc = await collections.users().findOne({ _id: nextAssignee }, { projection: { name: 1, department: 1 } });
  }

  let nextDept = incident.assignedDepartment ?? null;
  if (hasDept) {
    if (body.assignedDepartment === null || body.assignedDepartment === '') nextDept = null;
    else {
      const d = asString(body.assignedDepartment);
      if (!d || d.length > 100) throw new ApiError(400, 'Enter a department (up to 100 characters).', { field: 'assignedDepartment' });
      nextDept = d;
    }
  } else if (hasAssignee) {
    nextDept = assigneeDoc ? assigneeDoc.department || null : null;
  }

  const assigneeChanged = !sameId(nextAssignee, incident.assignedTo);
  const deptChanged = nextDept !== (incident.assignedDepartment ?? null);
  if (!assigneeChanged && !deptChanged) throw new ApiError(400, 'There are no changes to save.');

  const entries = [];
  if (assigneeChanged) {
    entries.push(timelineEntry(req.user, assigneeDoc && nextAssignee
      ? `Assigned to ${assigneeDoc.name}${nextDept ? ` (${nextDept})` : ''}`
      : 'Assignment removed', { internal: true }));
  } else if (deptChanged) {
    entries.push(timelineEntry(req.user, nextDept
      ? (incident.assignedDepartment ? `Department changed from ${incident.assignedDepartment} to ${nextDept}` : `Assigned to the ${nextDept} department`)
      : 'Department removed', { internal: true }));
  }

  await collections.incidents().updateOne(
    { _id: incident._id },
    {
      $set: {
        assignedTo: nextAssignee,
        assignedDepartment: nextDept,
        assignedBy: nextAssignee || nextDept ? req.user._id : null,
        updatedAt: new Date(),
      },
      $push: { timeline: { $each: entries } },
    },
  );

  if (assigneeChanged && nextAssignee) {
    await notifyUsers([nextAssignee], {
      incidentId: incident._id,
      referenceId: incident.referenceId,
      type: 'assigned',
      title: 'Report assigned to you',
      message: `You were assigned report ${incident.referenceId}.`,
    }, { exclude: req.user._id });
  }

  const updated = await collections.incidents().findOne({ _id: incident._id });
  res.json({ success: true, incident: await serializeIncident(updated, req.user) });
});

// PATCH /api/incidents/:id/details   (administrator)  { priority?, category? }
const updateDetails = asyncHandler(async (req, res) => {
  const { incident } = await loadIncidentById(req.params.id, req.user, { requireManage: true });
  const body = req.body || {};
  const set = {};
  const entries = [];

  if (body.priority !== undefined) {
    if (typeof body.priority !== 'string' || !PRIORITIES.includes(body.priority)) {
      throw new ApiError(400, `priority must be one of: ${PRIORITIES.join(', ')}.`, { field: 'priority' });
    }
    if (body.priority !== incident.priority) {
      set.priority = body.priority;
      entries.push(timelineEntry(req.user, `Priority set to ${body.priority}`, { internal: true }));
    }
  }
  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !CATEGORIES.includes(body.category)) {
      throw new ApiError(400, 'Choose a valid category.', { field: 'category' });
    }
    if (body.category !== incident.category) {
      set.category = body.category;
      entries.push(timelineEntry(req.user, `Category changed to ${body.category}`, { internal: true }));
    }
  }
  if (!entries.length) throw new ApiError(400, 'There are no changes to save.');

  set.updatedAt = new Date();
  await collections.incidents().updateOne({ _id: incident._id }, { $set: set, $push: { timeline: { $each: entries } } });
  const updated = await collections.incidents().findOne({ _id: incident._id });
  res.json({ success: true, incident: await serializeIncident(updated, req.user) });
});

// DELETE /api/incidents/:id   (administrator)
const deleteIncident = asyncHandler(async (req, res) => {
  const id = new ObjectId(req.params.id);
  const incident = await collections.incidents().findOne({ _id: id });
  if (!incident) throw new ApiError(404, 'That report no longer exists.');

  await collections.incidents().deleteOne({ _id: id });
  await Promise.all([
    collections.responses().deleteMany({ incidentId: id }),
    collections.notifications().deleteMany({ incidentId: id }),
  ]);
  await destroyByUrls(incident.attachments || []);

  await notifyUsers([incident.reporterId], {
    incidentId: id,
    referenceId: incident.referenceId,
    type: 'incident_removed',
    title: 'Report removed',
    message: `Report ${incident.referenceId} was removed by an administrator.`,
  }, { exclude: req.user._id });

  res.json({ success: true, message: `Report ${incident.referenceId} was deleted.` });
});

module.exports = {
  createIncident,
  listIncidents,
  getMyIncidents,
  getAssignedIncidents,
  getIncidentById,
  getIncidentByReference,
  updateStatus,
  updateAssignment,
  updateDetails,
  deleteIncident,
};
