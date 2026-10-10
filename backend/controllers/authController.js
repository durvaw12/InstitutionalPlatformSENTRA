const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { PUBLIC_ROLES } = require('../utils/constants');
const { asString, isStrongPassword, validateUserFields, validationError } = require('../utils/validators');
const { publicUser } = require('../utils/serializers');

const SALT_ROUNDS = 12;
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('sentra-timing-equaliser-1', SALT_ROUNDS);

/** The role is read from the database record, never from the request. */
function signToken(user) {
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  });
}

// POST /api/auth/register  (public; student or staff only)
const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const requested = body.role === undefined || body.role === '' ? 'student' : asString(body.role).toLowerCase();

  if (requested === 'administrator') {
    throw new ApiError(403, 'Administrator accounts cannot be created through public registration.', { field: 'role' });
  }
  if (!PUBLIC_ROLES.includes(requested)) throw new ApiError(400, 'Choose student or staff as your role.', { field: 'role' });

  const { errors, clean } = validateUserFields(body, { role: requested, require: ['name', 'email', 'password', 'department'] });
  if (Object.keys(errors).length) throw validationError(errors);

  const users = collections.users();
  if (await users.findOne({ email: clean.email }, { projection: { _id: 1 } })) {
    throw new ApiError(409, 'An account with this email already exists.', { field: 'email' });
  }

  const now = new Date();
  const doc = {
    name: clean.name,
    email: clean.email,
    passwordHash: await bcrypt.hash(clean.password, SALT_ROUNDS),
    role: requested,
    department: clean.department,
    phone: clean.phone ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await users.insertOne(doc);
  // No token here: the frontend sends people to the sign-in page after sign-up.
  res.status(201).json({ success: true, user: publicUser({ ...doc, _id: insertedId }) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email) throw new ApiError(400, 'Enter a valid email address.', { field: 'email' });
  if (!password) throw new ApiError(400, 'Enter your password.', { field: 'password' });

  const user = await collections.users().findOne({ email });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, 'Email or password is incorrect.', { field: 'password' });
  if (user.isActive !== true) {
    throw new ApiError(403, 'This account is deactivated. Contact an administrator.', { field: 'email' });
  }

  res.json({ success: true, token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// PATCH /api/auth/profile  { name?, department?, phone? }
const updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { errors, clean } = validateUserFields(
    { name: body.name, department: body.department, phone: body.phone },
    { role: req.user.role },
  );
  if (Object.keys(errors).length) throw validationError(errors);
  if (!Object.keys(clean).length) throw new ApiError(400, 'There are no changes to save.');

  const updated = await collections
    .users()
    .findOneAndUpdate(
      { _id: req.user._id },
      { $set: { ...clean, updatedAt: new Date() } },
      { returnDocument: 'after', projection: { passwordHash: 0 } },
    );
  res.json({ success: true, user: publicUser(updated) });
});

// PATCH /api/auth/email  { email, password }
const changeEmail = asyncHandler(async (req, res) => {
  const { errors, clean } = validateUserFields({ email: req.body?.email }, { require: ['email'] });
  if (Object.keys(errors).length) throw validationError(errors);

  const current = await collections.users().findOne({ _id: req.user._id });
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || !(await bcrypt.compare(password, current.passwordHash))) {
    throw new ApiError(400, 'Your current password is incorrect.', { field: 'password' });
  }
  if (clean.email === current.email) throw new ApiError(400, 'That is already your email address.', { field: 'email' });
  if (await collections.users().findOne({ email: clean.email, _id: { $ne: current._id } }, { projection: { _id: 1 } })) {
    throw new ApiError(409, 'An account with this email already exists.', { field: 'email' });
  }

  const updated = await collections
    .users()
    .findOneAndUpdate(
      { _id: current._id },
      { $set: { email: clean.email, updatedAt: new Date() } },
      { returnDocument: 'after', projection: { passwordHash: 0 } },
    );
  res.json({ success: true, user: publicUser(updated) });
});

// PATCH /api/auth/password  { currentPassword, newPassword }
const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = req.body?.newPassword;

  const current = await collections.users().findOne({ _id: req.user._id });
  if (!currentPassword || !(await bcrypt.compare(currentPassword, current.passwordHash))) {
    throw new ApiError(400, 'Your current password is incorrect.', { field: 'currentPassword' });
  }
  if (!isStrongPassword(newPassword)) {
    throw new ApiError(400, 'Use at least 8 characters, with letters and a number.', { field: 'newPassword' });
  }
  if (newPassword === currentPassword) {
    throw new ApiError(400, 'Choose a password different from your current one.', { field: 'newPassword' });
  }

  await collections
    .users()
    .updateOne({ _id: new ObjectId(current._id) }, { $set: { passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS), updatedAt: new Date() } });
  res.json({ success: true, message: 'Password changed.' });
});

module.exports = { register, login, me, updateProfile, changeEmail, changePassword };
