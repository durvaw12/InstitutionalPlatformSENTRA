const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { timelineEntry, sameId } = require('../utils/incidentHelpers');
const { publicUser } = require('../utils/serializers');
const {
  asString,
  escapeRegex,
  parseStrictBool,
  validateUserFields,
  validationError,
} = require('../utils/validators');

const SALT_ROUNDS = 12;

/** Open (not Resolved) incidents currently assigned to each user: { userId: count } */
async function openCaseCounts(userIds) {
  if (!userIds.length) return new Map();
  const rows = await collections
    .incidents()
    .aggregate([
      { $match: { assignedTo: { $in: userIds }, status: { $ne: 'Resolved' } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

/** Clears the assignment on every incident held by `userId` and records it on the internal timeline. */
async function unassignIncidentsOf(userId, actor, reason) {
  const result = await collections.incidents().updateMany(
    { assignedTo: userId },
    {
      $set: { assignedTo: null, assignedDepartment: null, assignedBy: null, updatedAt: new Date() },
      $push: { timeline: timelineEntry(actor, reason, { internal: true }) },
    },
  );
  return result.modifiedCount;
}

// GET /api/users  (administrator)  ?role= &isActive= &q= &assignable=true
const listUsers = asyncHandler(async (req, res) => {
  const { role, isActive, q, assignable } = req.query;
  const filter = {};

  if (role !== undefined) {
    if (typeof role !== 'string' || !ROLES.includes(role)) throw new ApiError(400, 'Invalid role filter.');
    filter.role = role;
  }
  if (isActive !== undefined) {
    const active = parseStrictBool(isActive);
    if (active === undefined) throw new ApiError(400, 'isActive must be true or false.');
    filter.isActive = active;
  }
  // People an incident can be assigned to: active staff and administrators.
  if (assignable === 'true') {
    filter.isActive = true;
    filter.role = filter.role && filter.role !== 'student' ? filter.role : { $in: ['staff', 'administrator'] };
  }
  if (q !== undefined) {
    if (typeof q !== 'string') throw new ApiError(400, 'Invalid search.');
    const needle = q.trim().slice(0, 100);
    if (needle) {
      const rx = new RegExp(escapeRegex(needle), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { department: rx }];
    }
  }

  const users = await collections
    .users()
    .find(filter, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();
  const counts = await openCaseCounts(users.map((u) => u._id));

  res.json({
    success: true,
    total: users.length,
    users: users.map((u) => publicUser(u, { openCases: counts.get(String(u._id)) ?? 0 })),
  });
});

// GET /api/users/:id  (administrator, or the user themself)
const getUser = asyncHandler(async (req, res) => {
  const id = new ObjectId(req.params.id);
  if (req.user.role !== 'administrator' && !sameId(id, req.user._id)) {
    throw new ApiError(403, 'You do not have permission to view this user.');
  }
  const user = await collections.users().findOne({ _id: id }, { projection: { passwordHash: 0 } });
  if (!user) throw new ApiError(404, 'User not found.');
  const counts = await openCaseCounts([user._id]);
  res.json({ success: true, user: publicUser(user, { openCases: counts.get(String(user._id)) ?? 0 }) });
});

// POST /api/users  (administrator) — the only API route that can create an administrator
const createUser = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const role = asString(body.role).toLowerCase() || 'student';
  if (!ROLES.includes(role)) throw new ApiError(400, 'Choose student, staff or administrator.', { field: 'role' });

  const { errors, clean } = validateUserFields(body, { role, require: ['name', 'email', 'password', 'department'] });
  if (Object.keys(errors).length) throw validationError(errors);

  const users = collections.users();
  if (await users.findOne({ email: clean.email }, { projection: { _id: 1 } })) {
    throw new ApiError(409, 'A user with this email already exists.', { field: 'email' });
  }

  const now = new Date();
  const doc = {
    name: clean.name,
    email: clean.email,
    passwordHash: await bcrypt.hash(clean.password, SALT_ROUNDS),
    role,
    department: clean.department,
    phone: clean.phone ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await users.insertOne(doc);
  res.status(201).json({ success: true, user: publicUser({ ...doc, _id: insertedId }) });
});

// PATCH /api/users/:id  (administrator)  { name?, department?, phone?, role? }
const updateUser = asyncHandler(async (req, res) => {
  const id = new ObjectId(req.params.id);
  const body = req.body || {};
  const target = await collections.users().findOne({ _id: id }, { projection: { passwordHash: 0 } });
  if (!target) throw new ApiError(404, 'User not found.');

  const set = {};
  let nextRole = target.role;

  if (body.role !== undefined) {
    const role = asString(body.role).toLowerCase();
    if (!ROLES.includes(role)) throw new ApiError(400, 'Choose student, staff or administrator.', { field: 'role' });
    if (role !== target.role) {
      if (sameId(id, req.user._id)) throw new ApiError(403, 'You cannot change your own role or status.');
      set.role = role;
      nextRole = role;
    }
  }

  const { errors, clean } = validateUserFields(
    { name: body.name, department: body.department, phone: body.phone },
    { role: nextRole },
  );
  if (Object.keys(errors).length) throw validationError(errors);
  Object.assign(set, clean);

  if (!Object.keys(set).length) throw new ApiError(400, 'There are no changes to save.');
  set.updatedAt = new Date();

  const updated = await collections
    .users()
    .findOneAndUpdate({ _id: id }, { $set: set }, { returnDocument: 'after', projection: { passwordHash: 0 } });

  // A student cannot handle cases, so release anything assigned to someone demoted to student.
  if (set.role === 'student') {
    await unassignIncidentsOf(id, req.user, `Unassigned: ${target.name} is no longer staff`);
  }
  res.json({ success: true, user: publicUser(updated) });
});

// PATCH /api/users/:id/status  (administrator)  { isActive: boolean }
const setUserStatus = asyncHandler(async (req, res) => {
  const id = new ObjectId(req.params.id);
  const isActive = parseStrictBool(req.body?.isActive);
  if (isActive === undefined) throw new ApiError(400, 'isActive must be true or false.', { field: 'isActive' });
  if (sameId(id, req.user._id)) throw new ApiError(403, 'You cannot change your own role or status.');

  const updated = await collections
    .users()
    .findOneAndUpdate(
      { _id: id },
      { $set: { isActive, updatedAt: new Date() } },
      { returnDocument: 'after', projection: { passwordHash: 0 } },
    );
  if (!updated) throw new ApiError(404, 'User not found.');
  res.json({ success: true, user: publicUser(updated) });
});

// DELETE /api/users/:id  (administrator)
// Reports the user filed are kept; reports assigned to them become unassigned; their notifications are removed.
const deleteUser = asyncHandler(async (req, res) => {
  const id = new ObjectId(req.params.id);
  if (sameId(id, req.user._id)) throw new ApiError(403, 'You cannot delete your own account.');
  const target = await collections.users().findOne({ _id: id }, { projection: { name: 1 } });
  if (!target) throw new ApiError(404, 'That user no longer exists.');

  await unassignIncidentsOf(id, req.user, `Unassigned: ${target.name}'s account was deleted`);
  await collections.notifications().deleteMany({ userId: id });
  await collections.users().deleteOne({ _id: id });
  res.json({ success: true, message: `${target.name} was deleted.` });
});

module.exports = { listUsers, getUser, createUser, updateUser, setUserStatus, deleteUser };
