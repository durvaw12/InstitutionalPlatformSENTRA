import { useNavigate } from 'react-router-dom';
import { markRead, useSession } from '../store/AppStore';
import { Button, Empty, fmt, useTitle } from '../components/ui';
import '../styles/dashboard.css';
export default function Notifications() {
  useTitle('Notifications');
  const { db, me } = useSession();
  const nav = useNavigate();
  const list = db.notifications.filter((n) => n.userId === me.id);
  const unread = list.filter((n) => !n.read).map((n) => n.id);
  return (
    <>
      <div className="head">
        <div>
          <h1>Notifications</h1>
          <p>Confirmations and updates on your reports.</p>
        </div>
        {unread.length > 0 && (
          <Button variant="ghost" onClick={() => markRead(unread)}>
            Mark all as read
          </Button>
        )}
      </div>
      {list.length === 0 ? (
        <Empty title="You are all caught up">Alerts appear here when a report is submitted, assigned, or updated.</Empty>
      ) : (
        list.map((n) => (
          <button
            key={n.id}
            className={`notif ${n.read ? '' : 'unread'}`}
            onClick={() => {
              markRead([n.id]);
              const r = n.reportId && db.reports.find((x) => x.id === n.reportId);
              if (r) nav(`/app/reports/${r.id}`);
            }}
          >
            <span style={{ flex: 1 }}>{n.text}</span>
            <small>{fmt(n.at)}</small>
          </button>
        ))
      )}
    </>
  );
}
