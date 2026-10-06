import { useState } from 'react';
import { Phone, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { addResource, removeResource, useStore } from '../store/AppStore';
import { Button, Empty, Field, Modal, toast, useTitle } from '../components/ui';
import { DUMMY_MOBILE, isValidPhone, telHref } from '../utils/validation';
import '../styles/awarenessHub.css';
import '../styles/adminDashboard.css';
const KINDS = [
  { id: '', label: 'All' },
  { id: 'policy', label: 'Campus policies' },
  { id: 'helpline', label: 'Helplines' },
  { id: 'tip', label: 'Safety tips' },
];
export default function AwarenessHub() {
  useTitle('Awareness hub');
  const { db, me } = useStore();
  // Visitors who are not signed in can read the hub; only administrators see the add/delete controls.
  const admin = me?.role === 'administrator';
  const [sp, setSp] = useSearchParams();
  const kind = sp.get('kind') ?? '',
    q = sp.get('q') ?? '';
  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ kind: 'tip', title: '', body: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const needle = q.trim().toLowerCase();
  const rows = db.resources.filter(
    (r) => (!kind || r.kind === kind) && (!needle || `${r.title} ${r.body}`.toLowerCase().includes(needle)),
  );
  async function add(ev) {
    ev.preventDefault();
    const e = {};
    if (form.title.trim().length < 3) e.title = 'Enter a title of at least 3 characters.';
    if (form.body.trim().length < 10) e.body = 'Enter at least 10 characters of detail.';
    if (form.kind === 'helpline' && !isValidPhone(form.phone)) e.phone = `Enter a valid phone number, e.g. ${DUMMY_MOBILE}, 112 or 1800-180-5522.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await addResource({
        kind: form.kind,
        title: form.title.trim(),
        body: form.body.trim(),
        phone: form.kind === 'helpline' ? form.phone.trim() : undefined,
      });
      toast('Resource added');
      setOpen(false);
      setForm({ kind: 'tip', title: '', body: '', phone: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add the resource.', 'err');
    }
    setBusy(false);
  }
  async function remove(id) {
    try {
      await removeResource(id);
      toast('Resource removed');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove it.', 'err');
    }
    setConfirm(null);
  }
  return (
    <>
      <div className="head">
        <div>
          <h1>Awareness hub</h1>
          <p>Campus policies, helplines, and safety tips.</p>
        </div>
        {admin && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden /> Add resource
          </Button>
        )}
      </div>
      <div className="toolbar" role="search">
        <div style={{ flex: '2 1 240px' }}>
          <label htmlFor="rq">Search resources</label>
          <input id="rq" type="search" value={q} onChange={(e) => set('q', e.target.value)} />
        </div>
      </div>
      <div className="chips" role="group" aria-label="Filter by type">
        {KINDS.map((k) => (
          <button key={k.id} className="chip" aria-pressed={kind === k.id} onClick={() => set('kind', k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty title="No resources found">Try a different search or type.</Empty>
      ) : (
        <div className="cards">
          {rows.map((r) => (
            <article className="card" key={r.id}>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
              {r.phone && (
                <p>
                  <a className="btn btn-primary" href={telHref(r.phone)}>
                    <Phone size={16} aria-hidden /> Call {r.phone}
                  </a>
                </p>
              )}
              {admin &&
                (confirm === r.id ? (
                  <p>
                    <Button variant="danger" onClick={() => remove(r.id)}>
                      Confirm delete
                    </Button>{' '}
                    <Button variant="ghost" onClick={() => setConfirm(null)}>
                      Cancel
                    </Button>
                  </p>
                ) : (
                  <Button variant="ghost" onClick={() => setConfirm(r.id)} aria-label={`Delete ${r.title}`}>
                    <Trash2 size={16} aria-hidden /> Delete
                  </Button>
                ))}
            </article>
          ))}
        </div>
      )}
      <Modal open={open} title="Add resource" onClose={() => setOpen(false)}>
        <form onSubmit={add} noValidate>
          <Field id="a-kind" label="Type">
            {(p) => (
              <select {...p} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="policy">Campus policy</option>
                <option value="helpline">Helpline</option>
                <option value="tip">Safety tip</option>
              </select>
            )}
          </Field>
          <Field id="a-title" label="Title" error={errors.title}>
            {(p) => <input {...p} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
          </Field>
          <Field id="a-body" label="Details" error={errors.body}>
            {(p) => (
              <textarea
                {...p}
                style={{ minHeight: 90 }}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            )}
          </Field>
          {form.kind === 'helpline' && (
            <Field id="a-phone" label="Phone number" error={errors.phone}>
              {(p) => (
                <input {...p} type="tel" placeholder={DUMMY_MOBILE} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              )}
            </Field>
          )}
          <Button type="submit" loading={busy}>
            {busy ? 'Adding' : 'Add resource'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
