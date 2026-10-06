import { Link } from 'react-router-dom';
import { STATUSES } from '../store/constants';
import { scopeReports, useSession } from '../store/AppStore';
import { Empty, useTitle } from '../components/ui';
import RecentTable from '../components/RecentTable';
import '../styles/dashboard.css';

/** Student and staff dashboard. Administrators see AdminOverview instead. */
export default function Dashboard() {
  useTitle('Dashboard');
  const { db, me } = useSession();
  const mine = scopeReports(db, me, 'mine');
  const assigned = scopeReports(db, me, 'assigned');
  const count = (rs, s) => rs.filter((r) => r.status === s).length;
  const showAssigned = me.role === 'staff' && assigned.length > 0;
  const recent = (showAssigned ? assigned : mine)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <>
      <div className="head">
        <div>
          <h1>Welcome, {me.name.split(' ')[0]}</h1>
          <p>Your reports and their progress.</p>
        </div>
        <Link className="btn btn-primary" to="/app/report/new">
          New report
        </Link>
      </div>

      <div className="grid">
        <Link className="stat" to="/app/reports">
          <b>{mine.length}</b>
          <span>Reports you filed</span>
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} className="stat" to={`/app/reports?status=${encodeURIComponent(s)}`}>
            <b>{count(mine, s)}</b>
            <span>{s}</span>
          </Link>
        ))}
        {me.role === 'staff' && (
          <Link className="stat" to="/app/assigned">
            <b>{assigned.filter((r) => r.status !== 'Resolved').length}</b>
            <span>Open cases assigned to you</span>
          </Link>
        )}
      </div>

      <section>
        <h2>{showAssigned ? 'Your assigned cases' : 'Your recent reports'}</h2>
        {recent.length ? (
          <RecentTable rows={recent} />
        ) : (
          <Empty title="No reports yet">
            When you file a report it shows up here. <Link to="/app/report/new">File your first report</Link>.
          </Empty>
        )}
      </section>
    </>
  );
}
