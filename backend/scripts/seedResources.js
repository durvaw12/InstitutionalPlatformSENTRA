require('dotenv').config();
const { connectDB, closeDB, collections } = require('../config/db');

// Same content the frontend shipped with for the Awareness Hub (phone numbers are the frontend's dummy values; replace them).
const DEFAULTS = [
  { kind: 'policy', title: 'Reporting policy', body: 'Anyone on campus can report an incident. Administrators review every report, and you can choose to stay anonymous. Retaliating against a reporter is a policy violation.' },
  { kind: 'policy', title: 'Confidentiality', body: 'Anonymous reports never reveal the reporter to staff or administrators. Named reports are visible only to the people handling them.' },
  { kind: 'helpline', title: 'Campus Emergency & Security Desk (Internal Direct Line)', body: 'Why: Instant response on-campus for immediate physical safety or active security threats.', phone: '+91 98765 43210' },
  { kind: 'helpline', title: 'National Emergency Response (112)', body: 'Why: Single nationwide number for police, fire, or ambulance emergencies when off-campus or when local help is insufficient.', phone: '112' },
  { kind: 'helpline', title: 'Campus Medical Room / Infirmary (Internal Line)', body: 'Why: Immediate first-aid and on-site ambulance service for physical injuries or medical crises.', phone: '+91 98765 43211' },
  { kind: 'helpline', title: 'Anti-Ragging Helpline (1800-180-5522 / Campus Cell)', body: 'Why: Essential compliance requirement for colleges and critical for reporting harassment or student safety issues.', phone: '1800-180-5522' },
  { kind: 'helpline', title: "Women's Safety & Helpline (1091 / Campus WDC Cell)", body: 'Why: Dedicated, confidential response line for reporting harassment, stalking, or gender-based safety concerns.', phone: '1091' },
  { kind: 'tip', title: 'Report early, with specifics', body: 'Note where it happened, when, and what you saw. Details help the team act quickly.' },
  { kind: 'tip', title: 'Keep evidence safe', body: 'Save photos, messages, or documents. You can attach files to a report.' },
  { kind: 'tip', title: 'Look out for each other', body: 'If something feels unsafe, tell someone you trust or report it. You do not need proof to ask for help.' },
];

/** Fills the Awareness Hub on a fresh database. Does nothing if any resource already exists. */
async function seedResources() {
  const col = collections.resources();
  if ((await col.estimatedDocumentCount()) > 0) return { created: 0 };
  const base = Date.now();
  // Descending timestamps keep the list in the order above when sorted newest-first.
  const docs = DEFAULTS.map((d, i) => ({ phone: null, ...d, createdAt: new Date(base - i * 1000) }));
  await col.insertMany(docs);
  console.log(`[seedResources] Added ${docs.length} default Awareness Hub resources.`);
  return { created: docs.length };
}

module.exports = { seedResources };

if (require.main === module) {
  connectDB()
    .then(seedResources)
    .then(() => closeDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seedResources] Failed:', err.message);
      process.exit(1);
    });
}
