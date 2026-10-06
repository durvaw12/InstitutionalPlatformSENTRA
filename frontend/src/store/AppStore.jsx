import { useSyncExternalStore } from 'react';
import { DEPARTMENTS } from './constants';
import { EMAIL_RE, isStrongPassword, isValidPhone } from '../utils/validation';
const DB_KEY = 'sentra.db.v1';
const SESSION_KEY = 'sentra.session';
/** Access code required to create an administrator account. */
export const ADMIN_CODE = 'SENTRA-ADMIN';
export class FieldError extends Error {
  field;
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}
/* ---------- state container (persisted, synced across tabs) ---------- */
const defaultResources = () => [
  {
    id: 'r-policy-reporting',
    kind: 'policy',
    title: 'Reporting policy',
    body: 'Anyone on campus can report an incident. Administrators review every report, and you can choose to stay anonymous. Retaliating against a reporter is a policy violation.',
  },
  {
    id: 'r-policy-confidential',
    kind: 'policy',
    title: 'Confidentiality',
    body: 'Anonymous reports never reveal the reporter to staff or administrators. Named reports are visible only to the people handling them.',
  },
  {
    id: 'r-help-campus-security',
    kind: 'helpline',
    title: 'Campus Emergency & Security Desk (Internal Direct Line)',
    body: 'Why: Instant response on-campus for immediate physical safety or active security threats.',
    phone: '+91 98765 43210',
  },
  {
    id: 'r-help-emergency',
    kind: 'helpline',
    title: 'National Emergency Response (112)',
    body: 'Why: Single nationwide number for police, fire, or ambulance emergencies when off-campus or when local help is insufficient.',
    phone: '112',
  },
  {
    id: 'r-help-medical',
    kind: 'helpline',
    title: 'Campus Medical Room / Infirmary (Internal Line)',
    body: 'Why: Immediate first-aid and on-site ambulance service for physical injuries or medical crises.',
    phone: '+91 98765 43211',
  },
  {
    id: 'r-help-antiragging',
    kind: 'helpline',
    title: 'Anti-Ragging Helpline (1800-180-5522 / Campus Cell)',
    body: 'Why: Essential compliance requirement for colleges and critical for reporting harassment or student safety issues.',
    phone: '1800-180-5522',
  },
  {
    id: 'r-help-women',
    kind: 'helpline',
    title: "Women's Safety & Helpline (1091 / Campus WDC Cell)",
    body: 'Why: Dedicated, confidential response line for reporting harassment, stalking, or gender-based safety concerns.',
    phone: '1091',
  },
  {
    id: 'r-tip-specifics',
    kind: 'tip',
    title: 'Report early, with specifics',
    body: 'Note where it happened, when, and what you saw. Details help the team act quickly.',
  },
  {
    id: 'r-tip-evidence',
    kind: 'tip',
    title: 'Keep evidence safe',
    body: 'Save photos, messages, or documents. You can attach one file to a report.',
  },
  {
    id: 'r-tip-others',
    kind: 'tip',
    title: 'Look out for each other',
    body: 'If something feels unsafe, tell someone you trust or report it. You do not need proof to ask for help.',
  },
];
/** Bump when the built-in helplines change. Older saved data is upgraded once on load. */
const SEED_VERSION = 3;

/** Replaces the built-in helplines in saved data with the current set; policies, tips and custom resources are kept. */
function upgrade(d) {
  if ((d.seedVersion ?? 1) >= SEED_VERSION) return d;
  const helplines = defaultResources().filter((r) => r.kind === 'helpline');
  const ids = new Set(helplines.map((r) => r.id));
  const at = d.resources.findIndex((r) => r.id === 'r-help-emergency');
  const rest = d.resources.filter((r) => !ids.has(r.id));
  const insertAt = at === -1 ? rest.filter((r) => r.kind === 'policy').length : Math.min(at, rest.length);
  const next = {
    ...d,
    resources: [...rest.slice(0, insertAt), ...helplines, ...rest.slice(insertAt)],
    seedVersion: SEED_VERSION,
  };
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(next));
  } catch {
    /* keep the upgraded copy in memory only */
  }
  return next;
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return upgrade(JSON.parse(raw));
  } catch {
    /* fall through to a fresh database */
  }
  return { users: [], reports: [], owners: {}, notifications: [], resources: defaultResources(), seedVersion: SEED_VERSION };
}
let db = load();
let sessionId = sessionStorage.getItem(SESSION_KEY);
const compute = () => ({ db, me: db.users.find((u) => u.id === sessionId && u.active) ?? null });
let snap = compute();
const listeners = new Set();
const emit = () => {
  snap = compute();
  listeners.forEach((l) => l());
};
function commit(next) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(next));
  } catch {
    throw new Error('Browser storage is full. Remove the attachment or free up space, then try again.');
  }
  db = next;
  emit();
}
function setSession(id) {
  sessionId = id;
  if (id) sessionStorage.setItem(SESSION_KEY, id);
  else sessionStorage.removeItem(SESSION_KEY);
  emit();
}
window.addEventListener('storage', (e) => {
  if (e.key === DB_KEY) {
    db = load();
    emit();
  }
});
const subscribe = (l) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useStore = () => useSyncExternalStore(subscribe, () => snap);
/** For routes behind RequireAuth, where a signed-in user is guaranteed. */
export function useSession() {
  const s = useStore();
  if (!s.me) throw new Error('No active session');
  return { db: s.db, me: s.me };
}
/* ---------- helpers ---------- */
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
async function hash(password, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const notify = (userId, text, reportId) => ({ id: uid(), userId, at: now(), text, reportId, read: false });
function requireUser() {
  if (!snap.me) throw new Error('Your session has ended. Sign in again.');
  return snap.me;
}
function requireAdmin() {
  const me = requireUser();
  if (me.role !== 'administrator') throw new Error('Only administrators can do this.');
  return me;
}
/* ---------- permissions & selectors ---------- */
export const isOwner = (d, me, r) => d.owners[r.id] === me.id;
export const canManage = (me, r) => me.role === 'administrator' || (me.role === 'staff' && r.assigneeId === me.id);
export const canView = (d, me, r) => isOwner(d, me, r) || canManage(me, r);
/**
 * Department handling a report = the department of the person it is assigned to.
 * Read live from the assignee, so it stays correct if they are reassigned or their department changes.
 * Returns null when nobody is assigned, or '' when the assignee has no department on file.
 */
export function reportDepartment(d, r) {
  if (!r.assigneeId) return null;
  const a = d.users.find((u) => u.id === r.assigneeId);
  return a ? (a.department ?? '').trim() : '';
}
export function scopeReports(d, me, scope) {
  if (scope === 'all') return me.role === 'administrator' ? d.reports : [];
  if (scope === 'assigned') return d.reports.filter((r) => r.assigneeId === me.id);
  return d.reports.filter((r) => isOwner(d, me, r));
}
/** How the reporter is described to the person viewing a report (anonymity is respected). */
export const reporterLabel = (d, me, r) =>
  r.anonymous ? (isOwner(d, me, r) ? 'You (submitted anonymously)' : 'Anonymous') : isOwner(d, me, r) ? 'You' : r.reporterName;

export const visibleTimeline = (me, r) => (canManage(me, r) ? r.timeline : r.timeline.filter((e) => !e.internal));
export async function register(i) {
  await wait();
  const email = i.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) throw new FieldError('email', 'An account with this email already exists.');
  if (i.role === 'administrator' && i.adminCode?.trim() !== ADMIN_CODE)
    throw new FieldError('adminCode', 'That administrator access code is not valid.');
  const salt = uid();
  const user = {
    id: uid(),
    name: i.name.trim(),
    email,
    role: i.role,
    department: i.department.trim(),
    salt,
    passHash: await hash(i.password, salt),
    active: true,
    createdAt: now(),
  };
  commit({ ...db, users: [...db.users, user] });
  // No session is started here: after sign-up the person signs in on the Sign In page.
  return user;
}
export async function login(email, password) {
  await wait();
  const u = db.users.find((x) => x.email === email.trim().toLowerCase());
  if (!u || u.passHash !== (await hash(password, u.salt))) throw new FieldError('password', 'Email or password is incorrect.');
  if (!u.active) throw new FieldError('email', 'This account is deactivated. Contact an administrator.');
  setSession(u.id);
  return u;
}
export const logout = () => setSession(null);
export async function submitReport(i) {
  await wait();
  const me = requireUser();
  let id;
  do {
    id = `SNT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (db.reports.some((r) => r.id === id));
  const t = now();
  const report = {
    id,
    category: i.category,
    occurredAt: i.occurredAt,
    location: i.location.trim(),
    description: i.description.trim(),
    anonymous: i.anonymous,
    reporterName: i.anonymous ? null : me.name,
    attachment: i.attachment,
    status: 'Pending',
    priority: 'Medium',
    assigneeId: null,
    assigneeName: null,
    createdAt: t,
    updatedAt: t,
    timeline: [
      { id: uid(), at: t, actor: i.anonymous ? 'Anonymous reporter' : me.name, text: 'Report submitted', status: 'Pending' },
    ],
  };
  const alerts = [
    notify(me.id, `Report ${id} received. Keep this reference ID to track it.`, id),
    ...db.users
      .filter((u) => u.role === 'administrator' && u.active && u.id !== me.id)
      .map((a) => notify(a.id, `New ${i.category.toLowerCase()} report ${id} needs review.`, id)),
  ];
  commit({
    ...db,
    reports: [report, ...db.reports],
    owners: { ...db.owners, [id]: me.id },
    notifications: [...alerts, ...db.notifications],
  });
  return id;
}
export async function manageReport(id, c) {
  await wait();
  const me = requireUser();
  const r = db.reports.find((x) => x.id === id);
  if (!r) throw new Error('Report not found.');
  if (!canManage(me, r)) throw new Error('You do not have permission to update this report.');
  const admin = me.role === 'administrator';
  if (!admin && (c.priority || c.category || 'assigneeId' in c))
    throw new Error('Only administrators can change category, priority, or assignment.');
  const note = c.note?.trim() ?? '';
  if (c.status === 'Resolved' && r.status !== 'Resolved' && (!note || c.internal)) {
    throw new FieldError('note', 'Add a public note explaining the outcome before resolving.');
  }
  const t = now();
  const next = { ...r, updatedAt: t };
  const entries = [];
  const alerts = [];
  const owner = db.owners[r.id];
  const log = (text, opts = {}) => entries.push({ id: uid(), at: t, actor: me.name, text, ...opts });
  if (c.category && c.category !== r.category) {
    next.category = c.category;
    log(`Category changed to ${c.category}`, { internal: true });
  }
  if (c.priority && c.priority !== r.priority) {
    next.priority = c.priority;
    log(`Priority set to ${c.priority}`, { internal: true });
  }
  if ('assigneeId' in c && c.assigneeId !== r.assigneeId) {
    const a = c.assigneeId ? db.users.find((u) => u.id === c.assigneeId && u.active) : null;
    if (c.assigneeId && !a) throw new Error('That handler is no longer available.');
    next.assigneeId = a?.id ?? null;
    next.assigneeName = a?.name ?? null;
    log(a ? `Assigned to ${a.name}${a.department ? ` (${a.department})` : ''}` : 'Assignment removed', { internal: true });
    if (a && a.id !== me.id) alerts.push(notify(a.id, `You were assigned report ${r.id}.`, r.id));
  }
  if (c.status && c.status !== r.status) {
    next.status = c.status;
    log(`Status changed to ${c.status}`, { status: c.status });
    if (owner && owner !== me.id)
      alerts.push(
        notify(owner, c.status === 'Resolved' ? `Report ${r.id} was resolved.` : `Report ${r.id} is now ${c.status}.`, r.id),
      );
  }
  if (note) {
    log(note, { internal: !!c.internal });
    if (!c.internal && owner && owner !== me.id && !(c.status && c.status !== r.status))
      alerts.push(notify(owner, `New update on report ${r.id}.`, r.id));
  }
  if (!entries.length) throw new Error('There are no changes to save.');
  next.timeline = [...r.timeline, ...entries];
  commit({ ...db, reports: db.reports.map((x) => (x.id === id ? next : x)), notifications: [...alerts, ...db.notifications] });
}
/* ---------- users, awareness hub, notifications ---------- */
export async function updateUser(id, patch) {
  await wait(200);
  const me = requireAdmin();
  if (id === me.id) throw new Error('You cannot change your own role or status.');
  commit({ ...db, users: db.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
}
/** Administrator-only. Removes a user. Reports they filed are kept; reports assigned to them become unassigned. */
export async function deleteUser(id) {
  await wait(200);
  const me = requireAdmin();
  if (id === me.id) throw new Error('You cannot delete your own account.');
  const target = db.users.find((u) => u.id === id);
  if (!target) throw new Error('That user no longer exists.');
  const t = now();
  const reports = db.reports.map((r) =>
    r.assigneeId === id
      ? {
          ...r,
          assigneeId: null,
          assigneeName: null,
          updatedAt: t,
          timeline: [
            ...r.timeline,
            { id: uid(), at: t, actor: me.name, text: `Unassigned: ${target.name}'s account was deleted`, internal: true },
          ],
        }
      : r,
  );
  commit({
    ...db,
    users: db.users.filter((u) => u.id !== id),
    reports,
    notifications: db.notifications.filter((n) => n.userId !== id),
  });
}
/** Role (student or staff) of the person who filed a report. Null for anonymous reports, so anonymity is kept. */
export const reporterRole = (d, r) => (r.anonymous ? null : (d.users.find((u) => u.id === d.owners[r.id])?.role ?? null));
/** Administrator-only. Unlike `register`, this leaves the current session untouched. */
export async function createUser(i) {
  await wait(250);
  requireAdmin();
  const email = i.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) throw new FieldError('email', 'A user with this email already exists.');
  const salt = uid();
  const user = {
    id: uid(),
    name: i.name.trim(),
    email,
    role: i.role,
    department: i.department.trim(),
    salt,
    passHash: await hash(i.password, salt),
    active: true,
    createdAt: now(),
  };
  commit({ ...db, users: [...db.users, user] });
  return user;
}
/** Administrator-only. Routes a reported task to a department and records it in the internal timeline. */
export async function assignDepartment(reportId, department) {
  await wait(250);
  const me = requireAdmin();
  if (!DEPARTMENTS.includes(department)) throw new Error('Choose a department from the list.');
  const r = db.reports.find((x) => x.id === reportId);
  if (!r) throw new Error('Report not found.');
  if (r.status === 'Resolved') throw new Error('Resolved reports cannot be reassigned.');
  if (r.department === department) throw new Error(`This report is already assigned to ${department}.`);
  const t = now();
  const entry = {
    id: uid(),
    at: t,
    actor: me.name,
    internal: true,
    text: r.department ? `Department changed from ${r.department} to ${department}` : `Assigned to the ${department} department`,
  };
  const next = { ...r, department, updatedAt: t, timeline: [...r.timeline, entry] };
  commit({ ...db, reports: db.reports.map((x) => (x.id === reportId ? next : x)) });
}
export async function addResource(r) {
  await wait(200);
  requireAdmin();
  commit({ ...db, resources: [{ ...r, id: uid() }, ...db.resources] });
}
export async function removeResource(id) {
  await wait(150);
  requireAdmin();
  commit({ ...db, resources: db.resources.filter((r) => r.id !== id) });
}
export function markRead(ids) {
  const me = requireUser();
  commit({
    ...db,
    notifications: db.notifications.map((n) => (n.userId === me.id && ids.includes(n.id) ? { ...n, read: true } : n)),
  });
}

/* ---------- my profile ---------- */
/** Any signed-in user. Updates basic details (name, department, optional phone). */
export async function updateProfile(i) {
  await wait(250);
  const me = requireUser();
  const name = i.name.trim();
  const phone = (i.phone ?? '').trim();
  if (name.length < 2) throw new FieldError('name', 'Enter your full name.');
  if (phone && !isValidPhone(phone)) throw new FieldError('phone', 'Enter a valid phone number, e.g. +91 98765 43210.');
  const department = me.role === 'administrator' ? (i.department ?? '').trim() : i.department.trim();
  if (me.role !== 'administrator' && department.length < 2) throw new FieldError('department', 'Enter your department.');
  const users = db.users.map((u) => (u.id === me.id ? { ...u, name, department, phone } : u));
  // Keep the visible reporter name on this person's named reports in step with their new name.
  const reports = db.reports.map((r) =>
    db.owners[r.id] === me.id && !r.anonymous ? { ...r, reporterName: name } : r,
  );
  commit({ ...db, users, reports });
}
/** Any signed-in user. Changing the sign-in email needs the current password. */
export async function changeEmail(newEmail, password) {
  await wait(300);
  const me = requireUser();
  const email = newEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new FieldError('email', 'Enter a valid email address.');
  if (email === me.email) throw new FieldError('email', 'That is already your email address.');
  if (me.passHash !== (await hash(password, me.salt))) throw new FieldError('password', 'Your current password is incorrect.');
  if (db.users.some((u) => u.email === email && u.id !== me.id))
    throw new FieldError('email', 'An account with this email already exists.');
  commit({ ...db, users: db.users.map((u) => (u.id === me.id ? { ...u, email } : u)) });
}
/** Any signed-in user. Needs the current password; the new one must differ and be strong. */
export async function changePassword(current, next) {
  await wait(300);
  const me = requireUser();
  if (me.passHash !== (await hash(current, me.salt))) throw new FieldError('current', 'Your current password is incorrect.');
  if (!isStrongPassword(next)) throw new FieldError('next', 'Use at least 8 characters, with letters and a number.');
  if (next === current) throw new FieldError('next', 'Choose a password different from your current one.');
  const salt = uid();
  const passHash = await hash(next, salt);
  commit({ ...db, users: db.users.map((u) => (u.id === me.id ? { ...u, salt, passHash } : u)) });
}
/* ---------- admin: delete reports, per-user report totals ---------- */
/** Administrator-only. Permanently removes a report, its ownership record and related alerts. */
export async function deleteReport(id) {
  await wait(250);
  const me = requireAdmin();
  const r = db.reports.find((x) => x.id === id);
  if (!r) throw new Error('That report no longer exists.');
  const owner = db.owners[id];
  const { [id]: _removed, ...owners } = db.owners;
  const alerts = [];
  if (owner && owner !== me.id) alerts.push(notify(owner, `Report ${id} was removed by an administrator.`));
  commit({
    ...db,
    reports: db.reports.filter((x) => x.id !== id),
    owners,
    notifications: [...alerts, ...db.notifications.filter((n) => n.reportId !== id)],
  });
}
/**
 * Reports uploaded by each user. Anonymous reports are not attributed to anyone, so they
 * are returned as a separate count and never added to a named user's total.
 */
export function reportCounts(d) {
  const byUser = {};
  let anonymous = 0;
  for (const r of d.reports) {
    if (r.anonymous) anonymous += 1;
    else {
      const o = d.owners[r.id];
      if (o) byUser[o] = (byUser[o] ?? 0) + 1;
    }
  }
  return { byUser, anonymous };
}
