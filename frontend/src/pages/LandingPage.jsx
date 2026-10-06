import { Link } from 'react-router-dom';
import { Lock, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useTitle } from '../components/ui';
import { telHref } from '../utils/validation';
import PublicNav from '../components/PublicNav';
import CampusIllustration from '../components/CampusIllustration';
import '../styles/landingPage.css';
export default function LandingPage() {
  useTitle('Campus incident reporting');
  const { db, me } = useStore();
  // The emergency card lists helplines that have a number to call; the full list with details is on the Awareness Hub.
  const helplines = db.resources.filter((r) => r.kind === 'helpline' && r.phone);
  // Signed-out visitors go to Sign In first; signed-in users keep their previous shortcut.
  const reportTo = !me ? '/login' : me.role === 'administrator' ? '/app' : '/app/report/new';
  return (
    <div className="lp">
      <PublicNav active="home" />

      <section className="lp-hero">
        <div className="lp-copy">
          <span className="lp-pill">
            <ShieldCheck size={14} aria-hidden /> Safe. Secure. Confidential.
          </span>
          <h1>
            Report. Respond.
            <br />
            <em>Build a Safer Campus.</em>
          </h1>
          <p>
            Sentra empowers students and staff to report incidents securely, track their status, and access awareness resources.
            Together, we create a culture of trust and safety.
          </p>
          <p className="lp-quote">
            <Lock size={18} aria-hidden /> “Your identity is protected. Always.”
          </p>
          <Link className="lp-btn lp-btn-solid lp-cta" to={reportTo}>
            Report an Incident <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="lp-art-wrap">
          <CampusIllustration />
        </div>
        <svg className="lp-wave" viewBox="0 0 1600 120" preserveAspectRatio="none" aria-hidden>
          <path d="M0 70 Q500 20 1000 45 T1600 25 V120 H0 Z" fill="#d6e4fb" />
          <path d="M0 110 Q500 92 1000 100 T1600 62 V120 H0 Z" fill="#1e3a8a" />
        </svg>
      </section>

      {helplines.length > 0 && (
        <section className="lp-help card" aria-labelledby="help">
          <h2 id="help">In immediate danger?</h2>
          {helplines.map((h) => (
            <p key={h.id}>
              <Phone size={16} aria-hidden /> <strong>{h.title}:</strong>{' '}
              <a href={telHref(h.phone)}>{h.phone}</a>
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
