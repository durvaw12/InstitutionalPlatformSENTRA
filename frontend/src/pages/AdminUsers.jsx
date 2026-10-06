import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { deleteUser, updateUser, useSession } from '../store/AppStore';
import { Button, Empty, fmt, toast, useTitle } from '../components/ui';
import AddUserModal from '../components/AddUserModal';
import '../styles/adminDashboard.css';
export default function AdminUsers() {
  useTitle('Users');
  const { db, me } = useSession();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const needle = q.trim().toLowerCase();
  const rows = db.users.filter(
    (u) => (!role || u.role === role) && (!needle || `${u.name} ${u.email} ${u.department}`.toLowerCase().includes(needle)),
  );
  const load = (u) => db.reports.filter((r) => r.assigneeId === u && r.status !== 'Resolved').length;
  async function change(id, patch) {
    setBusy(id);
    try {
      await updateUser(id, patch);
      toast('User updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed.', 'err');
    }
    setBusy(null);
  }
  async function remove(u) {
    setBusy(u.id);
    try {
      await deleteUser(u.id);
      toast(`${u.name} was deleted`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed.', 'err');
    }
    setBusy(null);
    setConfirmDel(null);
  }

  return (
    <>
      <div className="head">
        <div>
          <h1>Users</h1>
          <p>{db.users.length} registered. Roles control what each person can open.</p>
        </div>
        <Button type="button" onClick={() => setAdding(true)}>
          <UserPlus size={18} aria-hidden /> Add new user
        </Button>
      </div>
      <AddUserModal open={adding} onClose={() => setAdding(false)} />
      <div className="toolbar" role="search">
        <div style={{ flex: '2 1 220px' }}>
          <label htmlFor="uq">Search</label>
          <input id="uq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, department" />
        </div>
        <div>
          <label htmlFor="ur">Role</label>
          <select id="ur" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="administrator">Administrator</option>
          </select>
        </div>
      </div>
      {rows.length === 0 ? (
        <Empty title="No users match">Try a different search.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="stack">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Open cases</th>
                <th>Joined</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td data-label="Name">
                      <span>
                        {u.name}
                        {self && <span className="tag">You</span>}
                      </span>
                    </td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Department">{u.department || '—'}</td>
                    <td data-label="Role">
                      <select
                        aria-label={`Role for ${u.name}`}
                        value={u.role}
                        disabled={self || busy === u.id}
                        onChange={(e) => change(u.id, { role: e.target.value })}
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    </td>
                    <td data-label="Open cases">{load(u.id)}</td>
                    <td data-label="Joined">{fmt(u.createdAt)}</td>
                    <td data-label="Account">
                      <div className="row-actions">
                        <Button
                          variant={u.active ? 'ghost' : 'primary'}
                          disabled={self || confirmDel === u.id}
                          loading={busy === u.id && confirmDel !== u.id}
                          onClick={() => change(u.id, { active: !u.active })}
                        >
                          {u.active ? 'Deactivate' : 'Reactivate'}
                        </Button>
                        {confirmDel === u.id ? (
                          <>
                            <Button variant="danger" loading={busy === u.id} onClick={() => remove(u)}>
                              Confirm delete
                            </Button>
                            <Button variant="ghost" disabled={busy === u.id} onClick={() => setConfirmDel(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            disabled={self}
                            aria-label={`Delete ${u.name}`}
                            onClick={() => setConfirmDel(u.id)}
                          >
                            <Trash2 size={16} aria-hidden /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
