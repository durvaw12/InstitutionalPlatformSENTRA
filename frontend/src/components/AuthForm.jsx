import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { FieldError, login, register, useStore } from '../store/AppStore';
import { Button, Field, toast, useTitle } from '../components/ui';
import '../styles/loginPage.css';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default function AuthForm({ mode }) {
  const signup = mode === 'signup';
  useTitle(signup ? 'Create account' : 'Sign in');
  const { me } = useStore();
  const nav = useNavigate();
  const from = useLocation().state?.from ?? '/app';
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', department: '', adminCode: '' });
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  if (me && !busy) return <Navigate to={from} replace />;
  function validate() {
    const e = {};
    if (signup && f.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address.';
    if (signup) {
      if (f.password.length < 8 || !/\d/.test(f.password) || !/[a-zA-Z]/.test(f.password))
        e.password = 'Use at least 8 characters, with letters and a number.';
      if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
      if (role !== 'administrator' && !f.department.trim()) e.department = 'Enter your department.';
      if (role === 'administrator' && !f.adminCode.trim()) e.adminCode = 'Enter the administrator access code.';
    } else if (!f.password) e.password = 'Enter your password.';
    return e;
  }
  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (signup) {
        await register({
          name: f.name,
          email: f.email,
          password: f.password,
          role,
          department: f.department,
          adminCode: f.adminCode,
        });
        toast('Account created. Please sign in.');
        setBusy(false);
        nav('/login', { replace: true });
        return;
      }
      await login(f.email, f.password);
      nav(from, { replace: true });
    } catch (err) {
      setBusy(false);
      if (err instanceof FieldError) setErrors({ [err.field]: err.message });
      else setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    }
  }
  return (
    <div className="auth">
      <p>
        <Link to="/" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 700 }}>
          <ShieldCheck size={18} aria-hidden /> Sentra
        </Link>
      </p>
      <form className="card" onSubmit={submit} noValidate>
        <h1>{signup ? 'Create your account' : 'Sign in'}</h1>
        <p className="hint">{signup ? 'Choose the role that matches you on campus.' : 'Use the email you registered with.'}</p>
        {errors.form && (
          <div className="alert" role="alert">
            {errors.form}
          </div>
        )}
        {signup && (
          <fieldset className="roles">
            <legend>Role</legend>
            {['student', 'staff', 'administrator'].map((r) => (
              <label key={r}>
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                {r}
              </label>
            ))}
          </fieldset>
        )}
        {signup && (
          <Field id="name" label="Full name" error={errors.name}>
            {(p) => <input {...p} autoComplete="name" value={f.name} onChange={set('name')} />}
          </Field>
        )}
        <Field id="email" label="Email" error={errors.email}>
          {(p) => <input {...p} type="email" autoComplete="email" value={f.email} onChange={set('email')} />}
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          {(p) => (
            <input
              {...p}
              type="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              value={f.password}
              onChange={set('password')}
            />
          )}
        </Field>
        {signup && (
          <>
            <Field id="confirm" label="Confirm password" error={errors.confirm}>
              {(p) => <input {...p} type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} />}
            </Field>
            {role !== 'administrator' ? (
              <Field id="department" label="Department" error={errors.department}>
                {(p) => <input {...p} value={f.department} onChange={set('department')} />}
              </Field>
            ) : (
              <Field
                id="adminCode"
                label="Administrator access code"
                error={errors.adminCode}
                hint="Provided by your institution's IT office."
              >
                {(p) => <input {...p} value={f.adminCode} onChange={set('adminCode')} autoComplete="off" />}
              </Field>
            )}
          </>
        )}
        <Button type="submit" loading={busy} style={{ width: '100%' }}>
          {busy ? (signup ? 'Creating account' : 'Signing in') : signup ? 'Create account' : 'Sign in'}
        </Button>
        <p style={{ marginTop: 14, marginBottom: 0 }}>
          {signup ? (
            <>
              Already registered? <Link to="/login">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/signup">Create an account</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
