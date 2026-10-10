require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, closeDB, collections } = require('../config/db');
const { EMAIL_RE, isStrongPassword } = require('../utils/validators');

/**
 * Creates the first administrator from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD, but only if no administrator exists.
 * Never promotes an existing non-admin account and never logs the password. Safe to run repeatedly.
 */
async function seedAdmin() {
  const users = collections.users();

  if (await users.findOne({ role: 'administrator' }, { projection: { _id: 1 } })) {
    console.log('[seedAdmin] An administrator already exists. Nothing to do.');
    return { created: false, reason: 'exists' };
  }

  const name = (process.env.ADMIN_NAME || 'System Administrator').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.warn('[seedAdmin] No administrator exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping.');
    return { created: false, reason: 'missing-env' };
  }
  if (!EMAIL_RE.test(email)) {
    console.warn('[seedAdmin] ADMIN_EMAIL is not a valid email address. Skipping.');
    return { created: false, reason: 'invalid-email' };
  }
  if (!isStrongPassword(password)) {
    console.warn('[seedAdmin] ADMIN_PASSWORD must be 8-72 characters with letters and a number. Skipping.');
    return { created: false, reason: 'weak-password' };
  }
  if (await users.findOne({ email }, { projection: { _id: 1 } })) {
    console.warn(`[seedAdmin] ${email} already belongs to a non-administrator account. Use a different ADMIN_EMAIL. Skipping.`);
    return { created: false, reason: 'email-taken' };
  }

  const now = new Date();
  await users.insertOne({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'administrator',
    department: null,
    phone: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`[seedAdmin] Administrator created: ${email}`);
  return { created: true };
}

module.exports = { seedAdmin };

// `npm run seed:admin`
if (require.main === module) {
  connectDB()
    .then(seedAdmin)
    .then(() => closeDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seedAdmin] Failed:', err.message);
      process.exit(1);
    });
}
