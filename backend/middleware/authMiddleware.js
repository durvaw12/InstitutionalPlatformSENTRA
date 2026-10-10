const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the Bearer token, then re-reads the user from MongoDB on every request.
 * The role in the token is never trusted, and deactivated users are rejected immediately.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Your session has ended. Sign in again.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new ApiError(401, 'Your session has ended. Sign in again.');
  }
  if (!payload.sub || !/^[0-9a-fA-F]{24}$/.test(payload.sub)) throw new ApiError(401, 'Your session has ended. Sign in again.');

  const user = await collections.users().findOne({ _id: new ObjectId(payload.sub) }, { projection: { passwordHash: 0 } });
  if (!user || user.isActive !== true) throw new ApiError(401, 'Your session has ended. Sign in again.');

  req.user = user;
  next();
});

module.exports = { protect };
