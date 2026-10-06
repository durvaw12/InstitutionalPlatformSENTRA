import { useState } from 'react';
import { FieldError, createUser } from '../store/AppStore';
import { Button, Field, Modal, toast } from './ui';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', email: '', password: '', department: '' };
function AddUserForm({ onDone }) {
  const [f, setF] = useState(EMPTY);
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  function validate() {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter the full name.';
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address.';
    if (role !== 'administrator' && f.department.trim().length < 2) e.department = 'Enter the department.';
    if (f.password.length < 8 || !/\d/.test(f.password) || !/[a-zA-Z]/.test(f.password))
      e.password = 'Use at least 8 characters, with letters and a number.';
    return e;
  }
  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const user = await createUser({ ...f, role });
      toast(`${user.name} was added as ${user.role}`);
      onDone();
    } catch (err) {
      setBusy(false);
      if (err instanceof FieldError) setErrors({ [err.field]: err.message });
      else setErrors({ form: err instanceof Error ? err.message : 'Could not add the user. Try again.' });
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      {errors.form && (
        <div className="alert" role="alert">
          {errors.form}
        </div>
      )}
      <Field id="nu-name" label="Full name" error={errors.name}>
        {(p) => <input {...p} autoComplete="off" value={f.name} onChange={set('name')} />}
      </Field>
      <Field id="nu-email" label="Email" error={errors.email}>
        {(p) => <input {...p} type="email" autoComplete="off" value={f.email} onChange={set('email')} />}
      </Field>
      <div className="row">
        <Field id="nu-role" label="Role">
          {(p) => (
            <select {...p} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="administrator">Administrator</option>
            </select>
          )}
        </Field>
        <Field id="nu-dept" label={role === 'administrator' ? 'Department (optional)' : 'Department'} error={errors.department}>
          {(p) => (
            <input {...p} autoComplete="off" placeholder="e.g. IT Services" value={f.department} onChange={set('department')} />
          )}
        </Field>
      </div>
      <Field
        id="nu-pass"
        label="Temporary password"
        error={errors.password}
        hint="Share it with the user securely. They can sign in with it right away."
      >
        {(p) => <input {...p} type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />}
      </Field>
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {busy ? 'Adding user' : 'Add user'}
        </Button>
      </div>
    </form>
  );
}
export default function AddUserModal({ open, onClose }) {
  return (
    <Modal open={open} title="Add new user" onClose={onClose}>
      <AddUserForm onDone={onClose} />
    </Modal>
  );
}
