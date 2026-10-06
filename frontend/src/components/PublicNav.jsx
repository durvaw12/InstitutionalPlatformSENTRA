import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useStore } from '../store/AppStore';
import '../styles/landingPage.css';

/** Top bar for the public pages (landing and awareness hub). `active` is 'home' or 'awareness'. */
export default function PublicNav({ active }) {
  const { me } = useStore();
  const link = (key) => (active === key ? { className: 'active', 'aria-current': 'page' } : {});
  return (
    <header className="lp-nav">
      <Link to="/" className="lp-brand" aria-label="Sentra home">
        <ShieldCheck size={34} strokeWidth={1.6} aria-hidden />
        <span>
          <strong>Sentra</strong>
          <small>Campus Safety, Safer Campus Community</small>
        </span>
      </Link>
      <nav className="lp-links" aria-label="Public">
        <Link to="/" {...link('home')}>
          Home
        </Link>
        <Link to={me ? '/app/awareness' : '/awareness'} {...link('awareness')}>
          Awareness Hub
        </Link>
      </nav>
      <div className="lp-actions">
        {me ? (
          <Link className="lp-btn lp-btn-solid" to="/app">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link className="lp-btn lp-btn-outline" to="/login">
              Sign In
            </Link>
            <Link className="lp-btn lp-btn-solid" to="/signup">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
