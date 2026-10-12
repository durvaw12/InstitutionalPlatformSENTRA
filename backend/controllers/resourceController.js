const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { RESOURCE_KINDS } = require('../utils/constants');
const { serializeResource } = require('../utils/serializers');
const { asString, escapeRegex, isValidPhone, validationError } = require('../utils/validators');

// GET /api/resources  ?kind= &q=   (any signed-in user) — powers the Awareness Hub
const listResources = asyncHandler(async (req, res) => {
  const filter = {};
  const { kind, q } = req.query;
  if (kind !== undefined) {
    if (typeof kind !== 'string' || !RESOURCE_KINDS.includes(kind)) throw new ApiError(400, 'Invalid kind filter.');
    filter.kind = kind;
  }
  if (typeof q === 'string' && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim().slice(0, 100)), 'i');
    filter.$or = [{ title: rx }, { body: rx }];
  }
  const items = await collections.resources().find(filter).sort({ createdAt: -1, _id: -1 }).toArray();
  res.json({ success: true, resources: items.map(serializeResource) });
});

// POST /api/resources   (administrator)  { kind, title, body, phone? }
const createResource = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const errors = {};
  const kind = asString(b.kind);
  const title = asString(b.title);
  const body = asString(b.body);
  const phone = asString(b.phone);

  if (!RESOURCE_KINDS.includes(kind)) errors.kind = 'Choose policy, helpline or tip.';
  if (title.length < 3 || title.length > 150) errors.title = 'Enter a title of 3 to 150 characters.';
  if (body.length < 10 || body.length > 1000) errors.body = 'Enter 10 to 1000 characters of detail.';
  if (kind === 'helpline' && !isValidPhone(phone)) errors.phone = 'Enter a valid phone number, e.g. +91 98765 43210, 112 or 1800-180-5522.';
  if (Object.keys(errors).length) throw validationError(errors);

  const doc = { kind, title, body, phone: kind === 'helpline' ? phone : null, createdAt: new Date() };
  const { insertedId } = await collections.resources().insertOne(doc);
  res.status(201).json({ success: true, resource: serializeResource({ ...doc, _id: insertedId }) });
});

// DELETE /api/resources/:id   (administrator)
const deleteResource = asyncHandler(async (req, res) => {
  const { deletedCount } = await collections.resources().deleteOne({ _id: new ObjectId(req.params.id) });
  if (!deletedCount) throw new ApiError(404, 'Resource not found.');
  res.json({ success: true, message: 'Resource removed.' });
});

module.exports = { listResources, createResource, deleteResource };
