import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Loader2, X } from 'lucide-react';
export const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
export function useTitle(title) {
  useEffect(() => {
    document.title = `${title} · Sentra`;
  }, [title]);
}
export function Button({ loading, variant = 'primary', children, disabled, ...rest }) {
  return (
    <button {...rest} className={`btn btn-${variant} ${rest.className ?? ''}`} disabled={disabled || loading} aria-busy={loading}>
      {loading && <Loader2 className="spin" size={16} aria-hidden />}
      {children}
    </button>
  );
}
export function Field({ id, label, error, hint, children }) {
  const described = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': described })}
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="error" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export const StatusBadge = ({ status }) => <span className={`badge st-${status.replace(' ', '').toLowerCase()}`}>{status}</span>;
export const PriorityBadge = ({ priority }) => <span className={`badge pr-${priority.toLowerCase()}`}>{priority}</span>;
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Modal({ open, title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby="modal-title">
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
let toasts = [];
const subs = new Set();
export function toast(msg, kind = 'ok') {
  const t = { id: Date.now() + Math.random(), msg, kind };
  toasts = [...toasts, t];
  subs.forEach((s) => s());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    subs.forEach((s) => s());
  }, 4500);
}
export function Toaster() {
  const list = useSyncExternalStore(
    (s) => {
      subs.add(s);
      return () => {
        subs.delete(s);
      };
    },
    () => toasts,
  );
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
export function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          toast('Copy failed. Select the ID and copy it manually.', 'err');
        }
      }}
    >
      {done ? 'Copied' : 'Copy ID'}
    </Button>
  );
}
export function Stepper({ status }) {
  const steps = ['Pending', 'In Review', 'Resolved'];
  const at = steps.indexOf(status);
  return (
    <ol className="stepper" aria-label="Report progress">
      {steps.map((s, i) => (
        <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''} aria-current={i === at ? 'step' : undefined}>
          {s}
        </li>
      ))}
    </ol>
  );
}
