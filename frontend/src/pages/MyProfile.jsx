import { useState } from 'react';
import { FieldError, changeEmail, changePassword, updateProfile, useSession } from '../store/AppStore';
import { Button, Field, fmt, toast, useTitle } from '../components/ui';
import { DUMMY_MOBILE, EMAIL_RE, isStrongPassword, isValidPhone } from '../utils/validation';
import '../styles/adminDashboard.css';
import '../styles/profile.css';

/** Runs a save, mapping FieldErrors onto their fields and anything else onto a form-level message. */
async function run(action, setErrors, setBusy, okMessage, after) {
  setBusy(true);
  try {
    await action();
    toast(okMessage);
    after?.();
    setErrors({});
  } catch (err) {
    if (err instanceof FieldError) setErrors({ [err.field]: err.message });
    else setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
  }
  setBusy(false);
}

const FormAlert = ({ error }) =>
  error ? (
    <div className="alert" role="alert">
      {error}
    </div>
  ) : null;

function DetailsForm({ me }) {
  const admin = me.role === 'administrator';
  const [f, setF] = useState({ name: me.name, department: me.department ?? '', phone: me.phone ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const dirty = f.name.trim() !== me.name || f.department.trim() !== (me.department ?? '') || f.phone.trim() !== (me.phone ?? '');

  function submit(ev) {
    ev.preventDefault();
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!admin && f.department.trim().length < 2) e.department = 'Enter your department.';
    if (f.phone.trim() && !isValidPhone(f.phone)) e.phone = `Enter a valid phone number, e.g. ${DUMMY_MOBILE}.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    run(() => updateProfile(f), setErrors, setBusy, 'Profile updated');
  }
  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="pf-details">
      <h2 id="pf-details">Basic details</h2>
      <FormAlert error={errors.form} />
      <Field id="pf-name" label="Full name" error={errors.name}>
        {(p) => <input {...p} autoComplete="name" value={f.name} onChange={set('name')} />}
      </Field>
      <div className="row">
        <Field id="pf-dept" label={admin ? 'Department (optional)' : 'Department'} error={errors.department}>
          {(p) => <input {...p} value={f.department} onChange={set('department')} />}
        </Field>
        <Field id="pf-phone" label="Phone number (optional)" error={errors.phone}>
          {(p) => <input {...p} type="tel" autoComplete="tel" placeholder={DUMMY_MOBILE} value={f.phone} onChange={set('phone')} />}
        </Field>
      </div>
      <Button type="submit" loading={busy} disabled={!dirty}>
        {busy ? 'Saving' : 'Save details'}
      </Button>
    </form>
  );
}

function EmailForm({ me }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(ev) {
    ev.preventDefault();
    const e = {};
    if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.';
    else if (f.email.trim().toLowerCase() === me.email) e.email = 'That is already your email address.';
    if (!f.password) e.password = 'Enter your current password to confirm.';
    setErrors(e);
    if (Object.keys(e).length) return;
    run(() => changeEmail(f.email, f.password), setErrors, setBusy, 'Email updated. Use it the next time you sign in.', () =>
      setF({ email: '', password: '' }),
    );
  }
  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="pf-email">
      <h2 id="pf-email">Change email</h2>
      <p className="hint">
        Current email: <strong>{me.email}</strong>
      </p>
      <FormAlert error={errors.form} />
      <Field id="pf-new-email" label="New email" error={errors.email}>
        {(p) => <input {...p} type="email" autoComplete="email" value={f.email} onChange={set('email')} />}
      </Field>
      <Field id="pf-email-pass" label="Current password" error={errors.password} hint="Required to confirm it is you.">
        {(p) => <input {...p} type="password" autoComplete="current-password" value={f.password} onChange={set('password')} />}
      </Field>
      <Button type="submit" loading={busy}>
        {busy ? 'Updating' : 'Update email'}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const EMPTY = { current: '', next: '', confirm: '' };
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(ev) {
    ev.preventDefault();
    const e = {};
    if (!f.current) e.current = 'Enter your current password.';
    if (!isStrongPassword(f.next)) e.next = 'Use at least 8 characters, with letters and a number.';
    else if (f.next === f.current) e.next = 'Choose a password different from your current one.';
    if (f.confirm !== f.next) e.confirm = 'Passwords do not match.';
    setErrors(e);
    if (Object.keys(e).length) return;
    run(() => changePassword(f.current, f.next), setErrors, setBusy, 'Password changed', () => setF(EMPTY));
  }
  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="pf-pass">
      <h2 id="pf-pass">Change password</h2>
      <FormAlert error={errors.form} />
      <Field id="pf-cur" label="Current password" error={errors.current}>
        {(p) => <input {...p} type="password" autoComplete="current-password" value={f.current} onChange={set('current')} />}
      </Field>
      <div className="row">
        <Field id="pf-new" label="New password" error={errors.next}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={f.next} onChange={set('next')} />}
        </Field>
        <Field id="pf-confirm" label="Confirm new password" error={errors.confirm}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} />}
        </Field>
      </div>
      <Button type="submit" loading={busy}>
        {busy ? 'Changing' : 'Change password'}
      </Button>
    </form>
  );
}

/** Shared by students, staff and administrators. */
export default function MyProfile() {
  useTitle('My profile');
  const { db, me } = useSession();
  const filed = db.reports.filter((r) => db.owners[r.id] === me.id && !r.anonymous).length;
  return (
    <>
      <div className="head">
        <div>
          <h1>My profile</h1>
          <p>Keep your details and sign-in information up to date.</p>
        </div>
      </div>
      <section className="card profile-summary" aria-label="Account summary">
        <div className="avatar" aria-hidden>
          {me.name.trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <strong>{me.name}</strong>
          <span className={`badge role role-${me.role}`}>{me.role}</span>
          <p className="hint">
            {me.email} · Joined {fmt(me.createdAt)}
            {me.role !== 'administrator' ? ` · ${filed} named ${filed === 1 ? 'report' : 'reports'} filed` : ''}
          </p>
        </div>
      </section>
      <div className="profile-grid">
        <DetailsForm key={`${me.name}|${me.department}|${me.phone}`} me={me} />
        <EmailForm me={me} />
        <PasswordForm />
      </div>
    </>
  );
}
