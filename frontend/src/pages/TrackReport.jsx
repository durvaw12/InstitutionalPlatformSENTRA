import { useState } from 'react';
import { Link } from 'react-router-dom';
import { canView, scopeReports, useSession } from '../store/AppStore';
import PdfButton from '../components/PdfButton';
import { Button, Field, Stepper, StatusBadge, fmt, useTitle } from '../components/ui';
import '../styles/dashboard.css';
const REF = /^SNT-\d{4}-\d{6}$/;
export default function TrackReport() {
  useTitle('Track a report');
  const { db, me } = useSession();
  const [value, setValue] = useState('');
  const [looked, setLooked] = useState(null);
  const [error, setError] = useState('');
  const mine = scopeReports(db, me, 'mine').slice(0, 5);
  // Looked up live so a status change by an administrator shows without searching again.
  const report = looked ? db.reports.find((r) => r.id === looked && canView(db, me, r)) : undefined;
  function search(ev, override) {
    ev.preventDefault();
    const id = (override ?? value).trim().toUpperCase();
    setValue(id);
    if (!REF.test(id)) {
      setError('Enter the ID in this format: SNT-2026-123456.');
      setLooked(null);
      return;
    }
    setError('');
    setLooked(id);
  }
  return (
    <>
      <div className="head">
        <div>
          <h1>Track a report</h1>
          <p>Look up a report by its reference ID.</p>
        </div>
      </div>
      <form className="card" onSubmit={search} noValidate style={{ maxWidth: 560 }}>
        <Field id="ref" label="Reference ID" error={error}>
          {(p) => (
            <input
              {...p}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="SNT-2026-123456"
              autoComplete="off"
            />
          )}
        </Field>
        <Button type="submit">Find report</Button>
        {mine.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p className="hint">Your recent reports</p>
            <div className="chips">
              {mine.map((r) => (
                <button type="button" key={r.id} className="chip" onClick={(e) => search(e, r.id)}>
                  {r.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
      {looked &&
        (report ? (
          <section className="card" aria-live="polite" style={{ maxWidth: 560 }}>
            <h2>
              {report.id} <StatusBadge status={report.status} />
            </h2>
            <Stepper status={report.status} />
            <p>Last updated {fmt(report.updatedAt)}.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to={`/app/reports/${report.id}`}>
                View full details
              </Link>
              <PdfButton report={report} />
            </div>
          </section>
        ) : (
          <div className="alert" role="alert" style={{ maxWidth: 560 }}>
            No report with the ID {looked} is available to your account. Check the ID and try again.
          </div>
        ))}
    </>
  );
}
