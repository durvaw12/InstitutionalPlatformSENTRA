import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ClipboardList,
  FilePlus2,
  Files,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  ScanSearch,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { logout, useSession, useStore } from '../store/AppStore';
import { Toaster } from './ui';
export function RequireAuth() {
  const { me } = useStore();
  const loc = useLocation();
  if (!me) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return <Shell />;
}
export function RequireRole({ roles, children }) {
  const { me } = useSession();
  if (roles.includes(me.role)) return <>{children}</>;
  return (
    <div className="card narrow" role="alert">
      <h1>Access denied</h1>
      <p>Your {me.role} account cannot open this page.</p>
      <Link className="btn btn-primary" to="/app">
        Back to dashboard
      </Link>
    </div>
  );
}
function Shell() {
  const { db, me } = useSession();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  const admin = me.role === 'administrator';
  const unread = db.notifications.filter((n) => n.userId === me.id && !n.read).length;
  const items = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ...(!admin
      ? [
          { to: '/app/report/new', label: 'New report', icon: FilePlus2 },
          { to: '/app/reports', label: 'My reports', icon: Files },
          { to: '/app/track', label: 'Track a report', icon: ScanSearch },
        ]
      : []),
    ...(me.role === 'staff' ? [{ to: '/app/assigned', label: 'Assigned to me', icon: ListChecks }] : []),
    ...(me.role === 'administrator'
      ? [
          { to: '/app/admin/incidents', label: 'All incidents', icon: ClipboardList },
          { to: '/app/admin/users', label: 'Users', icon: Users },
        ]
      : []),
    { to: '/app/awareness', label: 'Awareness hub', icon: BookOpen },
    { to: '/app/notifications', label: 'Notifications', icon: Bell, badge: unread },
    { to: '/app/profile', label: 'My profile', icon: UserRound },
  ];
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="side">
        <Link to="/app" className="brand">
          <ShieldCheck size={22} aria-hidden /> Sentra
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={menuOpen}
          aria-controls="side-panel"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
        </button>
        <div id="side-panel" className={`side-panel ${menuOpen ? 'open' : ''}`}>
          <nav aria-label="Main">
            {items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav ${isActive ? 'active' : ''}`}>
                <Icon size={18} aria-hidden /> {label}
                {!!badge && (
                  <span className="count" aria-label={`${badge} unread`}>
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="me">
            <strong>{me.name}</strong>
            <span>
              {me.role}
              {me.department ? ` · ${me.department}` : ''}
            </span>
            <button className="nav" onClick={logout}>
              <LogOut size={18} aria-hidden /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
