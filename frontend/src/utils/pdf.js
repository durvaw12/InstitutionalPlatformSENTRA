import { jsPDF } from 'jspdf';
const when = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
/** The built-in PDF fonts only cover Latin-1; swap anything else for "?" so text is never garbled. */
const safe = (s) => s.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '?');
export function downloadReportPdf(report, o) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const textW = W - M * 2;
  let y = 0;
  const ensure = (need) => {
    if (y + need > H - M) {
      doc.addPage();
      y = M;
    }
  };
  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Sentra', M, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Incident report', M, 54);
  doc.text(`Generated ${when(new Date().toISOString())}`, W - M, 54, { align: 'right' });
  y = 104;
  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(safe(report.id), M, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(safe(`${report.category} - ${report.location}`), M, y, { maxWidth: textW });
  y += 28;
  const section = (title) => {
    ensure(40);
    doc.setDrawColor(219, 227, 238);
    doc.line(M, y, W - M, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(29, 78, 216);
    doc.text(title, M, y);
    y += 18;
  };
  const row = (label, value) => {
    const lines = doc.splitTextToSize(safe(value || '-'), textW - 120);
    ensure(lines.length * 14 + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(label, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    lines.forEach((ln, i) => doc.text(ln, M + 120, y + i * 14));
    y += lines.length * 14 + 6;
  };
  section('Details');
  row('Reference ID', report.id);
  row('Status', report.status);
  row('Priority', report.priority);
  row('Category', report.category);
  row('Location', report.location);
  row('Happened', when(report.occurredAt));
  row('Submitted', when(report.createdAt));
  row('Last updated', when(report.updatedAt));
  row('Reporter', o.reporter);
  row('Handled by', report.assigneeName ?? 'Not assigned yet');
  row('Department', o.department ?? 'Not assigned yet');
  section('Description');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.splitTextToSize(safe(report.description), textW).forEach((ln) => {
    ensure(16);
    doc.text(ln, M, y);
    y += 15;
  });
  y += 6;
  if (report.attachment) {
    section('Attachment');
    row('File', `${report.attachment.name} (${Math.ceil(report.attachment.size / 1024)} KB)`);
    const t = report.attachment.type;
    if (t === 'image/png' || t === 'image/jpeg') {
      try {
        const p = doc.getImageProperties(report.attachment.dataUrl);
        const w = Math.min(textW, 320);
        const h = (p.height / p.width) * w;
        const hh = Math.min(h, 300),
          ww = (hh / h) * w;
        ensure(hh + 10);
        doc.addImage(report.attachment.dataUrl, t === 'image/png' ? 'PNG' : 'JPEG', M, y, ww, hh);
        y += hh + 10;
      } catch {
        /* image could not be embedded; the file name is still listed */
      }
    }
  }
  section('Timeline');
  [...o.timeline].reverse().forEach((e) => {
    const lines = doc.splitTextToSize(safe(e.text), textW - 12);
    ensure(lines.length * 14 + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    lines.forEach((ln, i) => doc.text(ln, M + 12, y + i * 14));
    y += lines.length * 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(safe(`${e.actor} - ${when(e.at)}${e.internal ? ' (internal)' : ''}`), M + 12, y + 2);
    doc.setFillColor(29, 78, 216);
    doc.circle(M + 3, y - 10, 2.5, 'F');
    y += 18;
  });
  // Footer with page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Confidential - Sentra campus incident reporting', M, H - 24);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 24, { align: 'right' });
  }
  doc.save(`${report.id}.pdf`);
}
