import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATEGORIES, PRIORITIES, STATUSES } from '../store/constants';
import { deleteReport, reportCounts, reporterRole, scopeReports, useSession } from '../store/AppStore';
import { Button, Empty, Modal, PriorityBadge, StatusBadge, fmt, toast, useTitle } from '../components/ui';
import '../styles/adminDashboard.css';
const COPY = {
  mine: { title: 'My reports', sub: 'Everything you have filed, with live status.' },
  assigned: { title: 'Assigned to me', sub: 'Cases you are responsible for.' },
  all: { title: 'All incidents', sub: 'Review, categorise, and assign every report.' },
};
export default function IncidentsList({ scope }) {
  const { db, me } = useSession();
  const [sp, setSp] = useSearchParams();
  useTitle(COPY[scope].title);
  const q = sp.get('q') ?? '',
    status = sp.get('status') ?? '',
    category = sp.get('category') ?? '';
  const openOnly = sp.get('open') === '1';
  const priority = sp.get('priority') ?? '',
    assignee = sp.get('assignee') ?? '',
    sort = sp.get('sort') ?? 'updated';
  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const base = useMemo(() => scopeReports(db, me, scope), [db, me, scope]);
  const handlers = useMemo(() => db.users.filter((u) => u.active && u.role !== 'student'), [db.users]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return base
      .filter(
        (r) =>
          (!status || r.status === status) &&
          (!openOnly || r.status !== 'Resolved') &&
          (!category || r.category === category) &&
          (!priority || r.priority === priority) &&
          (!assignee || (assignee === 'none' ? !r.assigneeId : r.assigneeId === assignee)) &&
          (!needle ||
            [r.id, r.location, r.description, r.category, r.assigneeName ?? '', r.reporterName ?? ''].some((s) =>
              s.toLowerCase().includes(needle),
            )),
      )
      .sort((a, b) =>
        sort === 'priority'
          ? PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority) || b.updatedAt.localeCompare(a.updatedAt)
          : sort === 'oldest'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [base, q, status, openOnly, category, priority, assignee, sort]);
  const isAll = scope === 'all';
  const counts = useMemo(() => reportCounts(db), [db]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const uploaders = useMemo(
    () =>
      db.users
        .filter((u) => counts.byUser[u.id])
        .map((u) => ({ ...u, total: counts.byUser[u.id] }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    [db.users, counts],
  );
  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteReport(toDelete.id);
      toast(`Report ${toDelete.id} was deleted`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete the report.', 'err');
    }
    setDeleting(false);
    setToDelete(null);
  }
  const filtered = !!(q || openOnly || status || category || priority || assignee);
  const showTriage = scope !== 'mine';
  return (
    <>
      <div className="head">
        <div>
          <h1>{COPY[scope].title}</h1>
          <p>{COPY[scope].sub}</p>
        </div>
        {scope === 'mine' && (
          <Link className="btn btn-primary" to="/app/report/new">
            New report
          </Link>
        )}
      </div>

      <form className="toolbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <div style={{ flex: '2 1 220px' }}>
          <label htmlFor="q">Search</label>
          <input
            id="q"
            type="search"
            placeholder="ID, location, description"
            value={q}
            onChange={(e) => set('q', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fs">Status</label>
          <select id="fs" value={status} onChange={(e) => set('status', e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fc">Category</label>
          <select id="fc" value={category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {showTriage && (
          <div>
            <label htmlFor="fp">Priority</label>
            <select id="fp" value={priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="">All</option>
              {PRIORITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        {scope === 'all' && (
          <div>
            <label htmlFor="fa">Assigned to</label>
            <select id="fa" value={assignee} onChange={(e) => set('assignee', e.target.value)}>
              <option value="">Anyone</option>
              <option value="none">Unassigned</option>
              {handlers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="so">Sort by</label>
          <select id="so" value={sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="updated">Recently updated</option>
            <option value="oldest">Oldest first</option>
            {showTriage && <option value="priority">Highest priority</option>}
          </select>
        </div>
        {openOnly && (
          <div style={{ flex: '0 0 auto' }}>
            <span className="badge st-inreview">Open cases only</span>
          </div>
        )}
        {filtered && (
          <Button type="button" variant="ghost" onClick={() => setSp({}, { replace: true })}>
            Clear filters
          </Button>
        )}
      </form>

      <p className="hint" aria-live="polite">
        {rows.length} of {base.length} {base.length === 1 ? 'report' : 'reports'}
      </p>
      {isAll && (uploaders.length > 0 || counts.anonymous > 0) && (
        <details className="card uploader-summary">
          <summary>Reports uploaded by each user</summary>
          <ul>
            {uploaders.map((u) => (
              <li key={u.id}>
                <span>
                  {u.name} <span className={`badge role role-${u.role}`}>{u.role}</span>
                </span>
                <strong>{u.total}</strong>
              </li>
            ))}
            {counts.anonymous > 0 && (
              <li>
                <span>Anonymous reporters (not attributed to any user)</span>
                <strong>{counts.anonymous}</strong>
              </li>
            )}
          </ul>
        </details>
      )}
      {rows.length === 0 ? (
        <Empty
          title={
            base.length
              ? 'No reports match these filters'
              : scope === 'mine'
                ? 'You have not filed any reports'
                : scope === 'assigned'
                  ? 'Nothing is assigned to you'
                  : 'No incidents have been reported'
          }
        >
          {base.length ? (
            'Try removing a filter.'
          ) : scope === 'mine' ? (
            <Link to="/app/report/new">File a report</Link>
          ) : scope === 'assigned' ? (
            'An administrator can assign cases to you.'
          ) : (
            'New reports will appear here.'
          )}
        </Empty>
      ) : (
        <div className="table-wrap">
          <table className="stack">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Priority</th>
                {scope !== 'mine' && <th>Reporter</th>}
                {isAll && <th>Reports filed</th>}
                <th>Assigned to</th>
                <th>Updated</th>
                {isAll && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Reference">
                    <Link to={scope === 'all' ? `/app/admin/incidents/${r.id}` : `/app/reports/${r.id}`}>{r.id}</Link>
                  </td>
                  <td data-label="Category">{r.category}</td>
                  <td data-label="Location">{r.location}</td>
                  <td data-label="Status">
                    <StatusBadge status={r.status} />
                  </td>
                  <td data-label="Priority">
                    <PriorityBadge priority={r.priority} />
                  </td>
                  {scope !== 'mine' && (
                    <td data-label="Reporter">
                      {r.anonymous ? (
                        'Anonymous'
                      ) : (
                        <>
                          {r.reporterName}
                          {reporterRole(db, r) && (
                            <span className={`badge role role-${reporterRole(db, r)}`}>{reporterRole(db, r)}</span>
                          )}
                        </>
                      )}
                    </td>
                  )}
                  {isAll && (
                    <td data-label="Reports filed">
                      {r.anonymous ? <span className="hint">—</span> : (counts.byUser[db.owners[r.id]] ?? 0)}
                    </td>
                  )}
                  <td data-label="Assigned to">{r.assigneeName ?? <span className="hint">Unassigned</span>}</td>
                  <td data-label="Updated">{fmt(r.updatedAt)}</td>
                  {isAll && (
                    <td data-label="Actions">
                      <Button
                        variant="ghost"
                        type="button"
                        aria-label={`Delete report ${r.id}`}
                        onClick={() => setToDelete(r)}
                      >
                        <Trash2 size={16} aria-hidden /> Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!toDelete} title="Delete this report?" onClose={() => !deleting && setToDelete(null)}>
        {toDelete && (
          <>
            <p>
              You are about to permanently delete report <strong>{toDelete.id}</strong> ({toDelete.category}, {toDelete.location}).
              Its timeline and attachment will be removed, and this cannot be undone.
            </p>
            <div className="modal-actions">
              <Button type="button" variant="ghost" disabled={deleting} onClick={() => setToDelete(null)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting' : 'Delete report'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
