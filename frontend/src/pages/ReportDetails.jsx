import { Link, Navigate, useParams } from 'react-router-dom';
import { canView, useSession } from '../store/AppStore';
import { useTitle } from '../components/ui';
import ReportView from '../components/ReportView';
import '../styles/dashboard.css';

/** Report screen for students (their own reports) and staff (their own and assigned reports). */
export default function ReportDetails() {
  const { id } = useParams();
  const { db, me } = useSession();
  const report = db.reports.find((r) => r.id === id);
  useTitle(report ? report.id : 'Report not found');

  if (me.role === 'administrator') return <Navigate to={`/app/admin/incidents/${id}`} replace />;
  if (!report || !canView(db, me, report)) {
    return (
      <div className="card narrow">
        <h1>Report not found</h1>
        <p>No report with that reference ID is available to your account.</p>
        <Link className="btn btn-primary" to="/app/track">
          Track a report
        </Link>
      </div>
    );
  }
  return <ReportView report={report} />;
}
