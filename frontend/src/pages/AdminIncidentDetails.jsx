import { Link, useParams } from 'react-router-dom';
import { canView, useSession } from '../store/AppStore';
import { useTitle } from '../components/ui';
import ReportView from '../components/ReportView';
import '../styles/dashboard.css';
import '../styles/adminDashboard.css';

/** Administrator report screen: full manage panel, including assigning the incident to a staff member. */
export default function AdminIncidentDetails() {
  const { id } = useParams();
  const { db, me } = useSession();
  const report = db.reports.find((r) => r.id === id);
  useTitle(report ? report.id : 'Report not found');

  if (!report || !canView(db, me, report)) {
    return (
      <div className="card narrow">
        <h1>Report not found</h1>
        <p>No report with that reference ID is available to your account.</p>
        <Link className="btn btn-primary" to="/app/admin/incidents">
          Back to all incidents
        </Link>
      </div>
    );
  }
  return <ReportView report={report} />;
}
