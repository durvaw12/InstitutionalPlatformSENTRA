const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const { accessFor } = require('./incidentHelpers');

/** Whitelist serializer: passwordHash (and anything else not listed) can never leave the server. */
function publicUser(u, extra = {}) {
  if (!u) return null;
  return {
    _id: u._id,
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department ?? null,
    phone: u.phone ?? null,
    isActive: u.isActive === true,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    ...extra,
  };
}

async function loadUsersMap(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))].map((s) => new ObjectId(s));
  if (!unique.length) return new Map();
  const docs = await collections
    .users()
    .find({ _id: { $in: unique } }, { projection: { name: 1, role: 1, department: 1 } })
    .toArray();
  return new Map(docs.map((d) => [String(d._id), d]));
}

function personRef(map, id) {
  if (!id) return null;
  const u = map.get(String(id));
  return u
    ? { _id: u._id, id: String(u._id), name: u.name, role: u.role, department: u.department ?? null }
    : { _id: id, id: String(id), name: 'Deleted user', role: null, department: null };
}

function shapeIncident(incident, viewer, usersMap, { withTimeline = true, asSubmitter = false } = {}) {
  const access = accessFor(viewer, incident);
  const handler = access.canManage;
  const anonymous = !!incident.isAnonymous;
  // Anonymous: reporter data is never emitted, regardless of what is stored.
  const reporter = anonymous || !incident.reporterId ? null : personRef(usersMap, incident.reporterId);
  const assignee = incident.assignedTo ? personRef(usersMap, incident.assignedTo) : null;

  const out = {
    _id: incident._id,
    id: String(incident._id),
    referenceId: incident.referenceId,
    isAnonymous: anonymous,
    reporterId: reporter ? reporter._id : null,
    reporter,
    reporterName: reporter ? reporter.name : null,
    category: incident.category,
    location: incident.location,
    description: incident.description,
    occurredAt: incident.occurredAt ?? incident.createdAt,
    priority: incident.priority,
    status: incident.status,
    assignedTo: incident.assignedTo ?? null,
    assignee,
    assigneeName: assignee ? assignee.name : null,
    assignedDepartment: incident.assignedDepartment ?? null,
    assignedBy: handler ? (incident.assignedBy ?? null) : null,
    attachments: incident.attachments || [],
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    resolvedAt: incident.resolvedAt ?? null,
    isOwner: access.isOwner || asSubmitter,
    canManage: handler,
  };
  if (withTimeline) {
    out.timeline = (incident.timeline || [])
      .filter((e) => handler || !e.internal)
      .map((e) => ({ _id: e._id, at: e.at, actor: e.actor, text: e.text, status: e.status, internal: !!e.internal }));
  }
  return out;
}

async function serializeIncidents(incidents, viewer, opts = {}) {
  const ids = [];
  for (const i of incidents) {
    if (!i.isAnonymous && i.reporterId) ids.push(i.reporterId);
    if (i.assignedTo) ids.push(i.assignedTo);
  }
  const map = await loadUsersMap(ids);
  return incidents.map((i) => shapeIncident(i, viewer, map, opts));
}

async function serializeIncident(incident, viewer, opts = {}) {
  const [out] = await serializeIncidents([incident], viewer, opts);
  return out;
}

/**
 * Minimal view for someone who knows the reference ID of an ANONYMOUS report but is not a handler.
 * Status changes only: free-text notes and report details are not exposed.
 */
function serializeTracking(incident) {
  return {
    referenceId: incident.referenceId,
    isAnonymous: true,
    restricted: true,
    category: incident.category,
    status: incident.status,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    timeline: (incident.timeline || [])
      .filter((e) => e.status && !e.internal)
      .map((e) => ({ _id: e._id, at: e.at, text: e.text, status: e.status })),
  };
}

async function serializeResponses(responses, viewer) {
  const map = await loadUsersMap(responses.map((r) => r.authorId));
  return responses.map((r) => ({
    _id: r._id,
    id: String(r._id),
    incidentId: r.incidentId,
    authorId: r.authorId,
    author: personRef(map, r.authorId),
    type: r.type,
    message: r.message,
    isInternal: !!r.isInternal,
    createdAt: r.createdAt,
  }));
}

function serializeNotification(n) {
  return {
    _id: n._id,
    id: String(n._id),
    userId: n.userId,
    incidentId: n.incidentId,
    referenceId: n.referenceId ?? null,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: !!n.isRead,
    createdAt: n.createdAt,
  };
}

function serializeResource(r) {
  return {
    _id: r._id,
    id: String(r._id),
    kind: r.kind,
    title: r.title,
    body: r.body,
    phone: r.phone ?? null,
    createdAt: r.createdAt,
  };
}

module.exports = {
  publicUser,
  loadUsersMap,
  personRef,
  serializeIncident,
  serializeIncidents,
  serializeTracking,
  serializeResponses,
  serializeNotification,
  serializeResource,
};
