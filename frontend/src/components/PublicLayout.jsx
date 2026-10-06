import PublicNav from './PublicNav';
import '../styles/landingPage.css';

/** Wraps a page in the public top bar so visitors can read it without signing in. */
export default function PublicLayout({ active, children }) {
  return (
    <div className="lp">
      <PublicNav active={active} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
