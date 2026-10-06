import { FileDown } from 'lucide-react';
import { reportDepartment, reporterLabel, useSession, visibleTimeline } from '../store/AppStore';
import { downloadReportPdf } from '../utils/pdf';
import { toast } from './ui';

/** "Download PDF" button for a single report. Respects anonymity and hides internal notes from non-handlers. */
export default function PdfButton({ report, className = 'btn btn-ghost' }) {
  const { db, me } = useSession();
  function download() {
    try {
      downloadReportPdf(report, {
        reporter: String(reporterLabel(db, me, report)),
        department: report.assigneeId ? reportDepartment(db, report) || 'Not specified' : 'Not assigned yet',
        timeline: visibleTimeline(me, report),
      });
      toast('PDF downloaded');
    } catch {
      toast('The PDF could not be created.', 'err');
    }
  }
  return (
    <button type="button" className={className} onClick={download}>
      <FileDown size={16} aria-hidden /> Download PDF
    </button>
  );
}
