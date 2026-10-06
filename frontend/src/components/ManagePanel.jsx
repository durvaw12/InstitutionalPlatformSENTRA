import { useState } from 'react';
import { CATEGORIES, PRIORITIES, STATUSES } from '../store/constants';
import { FieldError, manageReport } from '../store/AppStore';
import { Button, Field, toast } from './ui';

export default function ManagePanel({ report, me, handlers }) {
  const admin = me.role === 'administrator';
  const [status, setStatus] = useState(report.status);
  const [priority, setPriority] = useState(report.priority);
  const [category, setCategory] = useState(report.category);
  const [assignee, setAssignee] = useState(report.assigneeId ?? '');
  const [note, setNote] = useState('');
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(ev) {
    ev.preventDefault();
    const c = { note, internal };
    if (status !== report.status) c.status = status;
    if (admin) {
      if (priority !== report.priority) c.priority = priority;
      if (category !== report.category) c.category = category;
      if (assignee !== (report.assigneeId ?? '')) c.assigneeId = assignee || null;
    }
    setBusy(true);
    setError('');
    try {
      await manageReport(report.id, c);
      toast('Report updated');
    } catch (e) {
      setError(e instanceof FieldError || e instanceof Error ? e.message : 'The update failed.');
      setBusy(false);
    }
  }
  return (
    <form className="card" onSubmit={save} noValidate aria-labelledby="mg">
      <h2 id="mg">Manage report</h2>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <Field id="m-status" label="Status">
        {(p) => (
          <select {...p} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </Field>
      {admin && (
        <>
          <Field id="m-cat" label="Category">
            {(p) => (
              <select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </Field>
          <Field id="m-pri" label="Priority">
            {(p) => (
              <select {...p} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </Field>
          <Field id="m-as" label="Assigned to">
            {(p) => (
              <select {...p} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {handlers.map((u) => (
                  <option key={u.id} value={u.id} title={u.email}>
                    {u.name}
                    {u.department ? ` – ${u.department}` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </>
      )}
      <Field
        id="m-note"
        label="Note"
        hint={
          internal
            ? 'Only staff and administrators will see this note.'
            : 'The reporter will see this note. Required when resolving.'
        }
      >
        {(p) => <textarea {...p} style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} />}
      </Field>
      <label className="check">
        <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
        <span>Internal note (hidden from the reporter)</span>
      </label>
      <Button type="submit" loading={busy}>
        {busy ? 'Saving' : 'Save changes'}
      </Button>
    </form>
  );
}
