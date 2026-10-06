import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, X } from 'lucide-react';
import { CATEGORIES } from '../store/constants';
import { submitReport } from '../store/AppStore';
import { Button, Field, toast, useTitle } from '../components/ui';
const MAX_BYTES = 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const readFile = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res({ name: file.name, type: file.type, size: file.size, dataUrl: String(r.result) });
    r.onerror = () => rej(new Error('The file could not be read.'));
    r.readAsDataURL(file);
  });
export default function ReportIncident() {
  useTitle('New report');
  const nav = useNavigate();
  const [f, setF] = useState({ category: '', occurredAt: localNow(), location: '', description: '' });
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState();
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function pick(e) {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    if (!TYPES.includes(picked.type)) return setErrors((p) => ({ ...p, file: 'Attach a PNG, JPG, or PDF file.' }));
    if (picked.size > MAX_BYTES) return setErrors((p) => ({ ...p, file: 'The file must be 1 MB or smaller.' }));
    try {
      setFile(await readFile(picked));
      setErrors((p) => ({ ...p, file: '' }));
    } catch (err) {
      setErrors((p) => ({ ...p, file: err.message }));
    }
  }
  async function submit(ev) {
    ev.preventDefault();
    const e = {};
    if (!f.category) e.category = 'Choose a category.';
    if (!f.occurredAt) e.occurredAt = 'Enter when it happened.';
    else if (new Date(f.occurredAt) > new Date()) e.occurredAt = 'The date and time cannot be in the future.';
    if (f.location.trim().length < 3) e.location = 'Describe where it happened (at least 3 characters).';
    if (f.description.trim().length < 20) e.description = 'Describe what happened in at least 20 characters.';
    if (f.description.length > 2000) e.description = 'Keep the description under 2000 characters.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const id = await submitReport({ ...f, category: f.category, anonymous, attachment: file });
      toast(`Report ${id} submitted`);
      nav(`/app/report/submitted/${id}`);
    } catch (err) {
      setBusy(false);
      toast(err instanceof Error ? err.message : 'The report could not be saved.', 'err');
    }
  }
  return (
    <>
      <div className="head">
        <div>
          <h1>New report</h1>
          <p>You will get a reference ID to track it.</p>
        </div>
      </div>
      <form className="card" onSubmit={submit} noValidate style={{ maxWidth: 720 }}>
        <div className="row">
          <Field id="category" label="Category" error={errors.category}>
            {(p) => (
              <select {...p} value={f.category} onChange={set('category')}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
          </Field>
          <Field id="occurredAt" label="When did it happen?" error={errors.occurredAt}>
            {(p) => <input {...p} type="datetime-local" max={localNow()} value={f.occurredAt} onChange={set('occurredAt')} />}
          </Field>
        </div>
        <Field id="location" label="Location" error={errors.location} hint="For example: Library, second floor, near the stairs.">
          {(p) => <input {...p} value={f.location} onChange={set('location')} />}
        </Field>
        <Field id="description" label="What happened?" error={errors.description} hint={`${f.description.length} / 2000`}>
          {(p) => <textarea {...p} value={f.description} onChange={set('description')} />}
        </Field>
        <Field id="file" label="Attachment (optional)" error={errors.file} hint="One PNG, JPG, or PDF, up to 1 MB.">
          {(p) => <input {...p} type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={pick} />}
        </Field>
        {file && (
          <p>
            <Paperclip size={14} aria-hidden /> {file.name} ({Math.ceil(file.size / 1024)} KB){' '}
            <button type="button" className="icon-btn" onClick={() => setFile(undefined)} aria-label={`Remove ${file.name}`}>
              <X size={14} />
            </button>
          </p>
        )}
        <label className="check">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span>
            <strong>Submit anonymously</strong>
            <br />
            <span className="hint">
              Your name will not be shown to administrators or staff. You can still track the report from your own account.
            </span>
          </span>
        </label>
        <Button type="submit" loading={busy}>
          {busy ? 'Submitting' : 'Submit report'}
        </Button>
      </form>
    </>
  );
}
