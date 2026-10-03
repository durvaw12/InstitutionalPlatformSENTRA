
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Users,
  Check,
  ArrowRight,
} from "lucide-react";

import "../styles/LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <ShieldCheck size={30} />
          </div>

          <div className="logo-text">
            <h2>Sentra</h2>
            <span>Campus Safety, Stronger Community</span>
          </div>
        </Link>

        <div className="nav-links">
          <Link to="/" className="active">
            Home
          </Link>

          <Link to="/awareness">
            Awareness Hub
          </Link>

        
        </div>

        <div className="nav-buttons">
          <Link to="/login" className="sign-in-btn">
            Sign In
          </Link>

          <Link to="/signup" className="sign-up-btn">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        {/* Background clouds */}
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>

        <div className="hero-left">
          <div className="safe-badge">
            <ShieldCheck size={14} />
            <span>Safe. Secure. Confidential.</span>
          </div>

          <h1>
            Report. Respond.
            <br />
            <span>Build a Safer Campus.</span>
          </h1>

          <p>
            Sentra empowers students and staff to report incidents
            securely, track their status, and access awareness
            resources. Together, we create a culture of trust and
            safety.
          </p>

          <div className="identity-text">
            <LockKeyhole size={20} />
            <span>Your identity is protected. Always.</span>
          </div>

          <div className="hero-actions">
            <Link to="/login" className="primary-action">
              Report an Incident
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* RIGHT ILLUSTRATION */}
        <div className="hero-right">
          {/* Campus Building */}
          <div className="campus">
            <div className="tower">
              <div className="clock"></div>
              <div className="tower-roof"></div>
            </div>

            <div className="building building-left">
              <div className="windows">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <div className="building building-main">
              <div className="windows">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <div className="building building-right">
              <div className="windows">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          {/* Main Shield */}
          <div className="big-shield">
            <ShieldCheck size={95} strokeWidth={1.7} />
            <Check className="shield-check" size={45} />
          </div>

          {/* People */}
          <div className="people">
            <div className="person person-one">
              <div className="head"></div>
              <div className="body"></div>
              <div className="legs">
                <span></span>
                <span></span>
              </div>
            </div>

            <div className="person person-two">
              <div className="head"></div>
              <div className="body"></div>
              <div className="legs">
                <span></span>
                <span></span>
              </div>
            </div>

            <div className="person person-three">
              <div className="head"></div>
              <div className="body"></div>
              <div className="legs">
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          {/* Decorative trees */}
          <div className="tree tree-one"></div>
          <div className="tree tree-two"></div>
          <div className="tree tree-three"></div>
        </div>
      </section>

      {/* Bottom wave */}
      <div className="bottom-wave"></div>
    </div>
  );
}

export default LandingPage;
