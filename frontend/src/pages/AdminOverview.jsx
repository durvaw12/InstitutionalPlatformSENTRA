import { Link } from 'react-router-dom';
import { CATEGORIES, STATUSES } from '../store/constants';
import { useSession } from '../store/AppStore';
import { Empty, useTitle } from '../components/ui';
import RecentTable from '../components/RecentTable';
import '../styles/dashboard.css';
import '../styles/adminDashboard.css';

/** Administrator dashboard: totals, latest activity and incidents by category. */
export default function AdminOverview() {
  useTitle('Dashboard');
  const { db, me } = useSession();
  const all = db.reports;
  const count = (s) => all.filter((r) => r.status === s).length;
  const open = all.filter((r) => r.status !== 'Resolved');
  const recent = all
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const byCat = CATEGORIES.map((c) => ({ c, n: all.filter((r) => r.category === c).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...byCat.map((x) => x.n));

  return (
    <>
      <div className="head">
        <div>
          <h1>Welcome, {me.name.split(' ')[0]}</h1>
          <p>Every incident on campus, in one place.</p>
        </div>
      </div>

      <div className="grid">
        <Link className="stat" to="/app/admin/incidents">
          <b>{all.length}</b>
          <span>Total incidents</span>
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} className="stat" to={`/app/admin/incidents?status=${encodeURIComponent(s)}`}>
            <b>{count(s)}</b>
            <span>{s}</span>
          </Link>
        ))}
        <Link className="stat" to="/app/admin/incidents?assignee=none&open=1">
          <b>{open.filter((r) => !r.assigneeId).length}</b>
          <span>Open and unassigned</span>
        </Link>
        <Link className="stat" to="/app/admin/incidents?priority=Critical&open=1">
          <b>{open.filter((r) => r.priority === 'Critical').length}</b>
          <span>Critical and open</span>
        </Link>
      </div>

      <div className="split">
        <section>
          <h2>Latest activity</h2>
          {recent.length ? (
            <RecentTable rows={recent} admin />
          ) : (
            <Empty title="No reports yet">Reports will appear here as soon as someone files one.</Empty>
          )}
        </section>
        <section className="card" aria-labelledby="bycat">
          <h2 id="bycat">Incidents by category</h2>
          {byCat.length ? (
            <div className="bars">
              {byCat.map(({ c, n }) => (
                <div className="bar" key={c}>
                  <span>{c}</span>
                  <div>
                    <i style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">No data yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
