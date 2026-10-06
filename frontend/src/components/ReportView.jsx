import { Paperclip } from 'lucide-react';
import { canManage, reportDepartment, reporterLabel, reporterRole, useSession, visibleTimeline } from '../store/AppStore';
import PdfButton from './PdfButton';
import ManagePanel from './ManagePanel';
import { CopyButton, PriorityBadge, Stepper, StatusBadge, fmt } from './ui';
import '../styles/dashboard.css';

/** Shared report screen: header, details, timeline, PDF button and the manage panel. Pages decide who may open it. */
export default function ReportView({ report }) {
  const { db, me } = useSession();
  const manage = canManage(me, report);
  const handlers = db.users.filter((u) => u.active && u.role !== 'student');
  const reporter = reporterLabel(db, me, report);
  const department = reportDepartment(db, report);
  return (
    <>
      <div className="head">
        <div>
          <h1>{report.id}</h1>
          <p>
            {report.category} · {report.location}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
          <CopyButton text={report.id} />
          <PdfButton report={report} />
        </div>
      </div>
      <Stepper status={report.status} />
      <div className="split">
        <div>
          <section className="card" aria-labelledby="dt">
            <h2 id="dt">Details</h2>
            <dl>
              <dt>Happened</dt>
              <dd>{fmt(report.occurredAt)}</dd>
              <dt>Submitted</dt>
              <dd>{fmt(report.createdAt)}</dd>
              <dt>Reporter</dt>
              <dd>
                {reporter}
                {manage && reporterRole(db, report) && (
                  <span className={`badge role role-${reporterRole(db, report)}`}>{reporterRole(db, report)}</span>
                )}
              </dd>
              <dt>Handled by</dt>
              <dd>{report.assigneeName ?? 'Not assigned yet'}</dd>
              <dt>Department</dt>
              <dd>{report.assigneeId ? department || 'Not specified' : 'Not assigned yet'}</dd>
              <dt>Description</dt>
              <dd style={{ whiteSpace: 'pre-wrap' }}>{report.description}</dd>
              {report.attachment && (
                <>
                  <dt>Attachment</dt>
                  <dd>
                    {report.attachment.type.startsWith('image/') && (
                      <img
                        src={report.attachment.dataUrl}
                        alt={`Attachment: ${report.attachment.name}`}
                        style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, display: 'block', marginBottom: 8 }}
                      />
                    )}
                    <a href={report.attachment.dataUrl} download={report.attachment.name}>
                      <Paperclip size={14} aria-hidden /> {report.attachment.name}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </section>
          <section className="card" aria-labelledby="tl">
            <h2 id="tl">Timeline</h2>
            <ol className="timeline">
              {visibleTimeline(me, report)
                .slice()
                .reverse()
                .map((e) => (
                  <li key={e.id} className={e.internal ? 'internal' : ''}>
                    <strong style={{ whiteSpace: 'pre-wrap' }}>{e.text}</strong>
                    {e.internal && <span className="tag">Internal</span>}
                    <br />
                    <small>
                      {e.actor} · {fmt(e.at)}
                    </small>
                  </li>
                ))}
            </ol>
          </section>
        </div>
        {manage && <ManagePanel key={report.updatedAt} report={report} me={me} handlers={handlers} />}
      </div>
    </>
  );
}
