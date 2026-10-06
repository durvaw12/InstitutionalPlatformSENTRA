import { Link, Navigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { isOwner, reporterLabel, useSession } from '../store/AppStore';
import { CopyButton, StatusBadge, fmt, useTitle } from '../components/ui';
import PdfButton from '../components/PdfButton';
import '../styles/dashboard.css';

/** Shown right after a report is submitted: reference ID, a short summary, and next steps. */
export default function ReportConfirmation() {
  useTitle('Report submitted');
  const { id } = useParams();
  const { db, me } = useSession();
  const report = db.reports.find((r) => r.id === id);
  if (!report || !isOwner(db, me, report)) return <Navigate to="/app/reports" replace />;

  return (
    <section className="confirm card" aria-labelledby="confirm-title">
      <div className="confirm-icon" aria-hidden>
        <CheckCircle2 size={40} />
      </div>
      <h1 id="confirm-title">Report submitted</h1>
      <p className="confirm-lead">Thank you. Your report has been received and the team will review it shortly.</p>

      <div className="confirm-ref">
        <div>
          <span>Reference ID</span>
          <strong>{report.id}</strong>
        </div>
        <CopyButton text={report.id} />
      </div>
      <p className="hint confirm-hint">Keep this ID. You can use it to track progress at any time.</p>

      <dl className="confirm-summary">
        <dt>Category</dt>
        <dd>{report.category}</dd>
        <dt>Location</dt>
        <dd>{report.location}</dd>
        <dt>Submitted</dt>
        <dd>{fmt(report.createdAt)}</dd>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={report.status} />
        </dd>
        <dt>Reporter</dt>
        <dd>{reporterLabel(db, me, report)}</dd>
      </dl>

      <div className="confirm-actions">
        <Link className="btn btn-primary" to={`/app/reports/${report.id}`}>
          View report
        </Link>
        <PdfButton report={report} />
        <Link className="btn btn-ghost" to="/app/track">
          Track a report
        </Link>
      </div>
    </section>
  );
}
