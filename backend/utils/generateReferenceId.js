const { collections } = require('../config/db');

/**
 * Sequential per-year reference ID, e.g. INC-2026-0001.
 * Uses an atomic counter, so concurrent submissions can never collide. Past 9999 the number simply grows (INC-2026-10000).
 */
async function generateReferenceId() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const doc = await collections
        .counters()
        .findOneAndUpdate({ _id: `incident-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
      return `INC-${year}-${String(doc.seq).padStart(4, '0')}`;
    } catch (err) {
      // Two first-ever inserts racing for the same upsert: one gets E11000, a retry succeeds.
      if (err.code !== 11000 || attempt === 2) throw err;
    }
  }
  throw new Error('Could not generate a reference ID.');
}

module.exports = generateReferenceId;
