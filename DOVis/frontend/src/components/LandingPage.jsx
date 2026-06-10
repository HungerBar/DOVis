import './LandingPage.css';
import heroImg from '../assets/landing-hero.jpg';

export default function LandingPage({ onEnter }) {
  return (
    <div className="landing">
      <div className="landing-bg" style={{ backgroundImage: `url(${heroImg})` }} />
      <div className="light-cone" />

      <div className="particles">
        <span /><span /><span /><span /><span />
        <span /><span /><span /><span /><span />
        <span /><span /><span /><span /><span />
        <span /><span /><span />
      </div>

      <div className="corner corner--tl"><svg viewBox="0 0 48 48" fill="none" stroke="rgba(200,198,192,0.35)" strokeWidth="1"><path d="M0 16 L0 0 L16 0"/></svg></div>
      <div className="corner corner--tr"><svg viewBox="0 0 48 48" fill="none" stroke="rgba(200,198,192,0.35)" strokeWidth="1"><path d="M0 16 L0 0 L16 0"/></svg></div>
      <div className="corner corner--bl"><svg viewBox="0 0 48 48" fill="none" stroke="rgba(200,198,192,0.35)" strokeWidth="1"><path d="M0 16 L0 0 L16 0"/></svg></div>
      <div className="corner corner--br"><svg viewBox="0 0 48 48" fill="none" stroke="rgba(200,198,192,0.35)" strokeWidth="1"><path d="M0 16 L0 0 L16 0"/></svg></div>

      <div className="landing-content">
        <h1 className="landing-brand">DOVis</h1>
        <p className="landing-headline">Six thousand meters of silence.</p>
        <div className="landing-divider" />
        <p className="landing-tagline">Global Dissolved Oxygen Visualization</p>
        <button className="landing-cta" onClick={onEnter}>Enter</button>
      </div>
    </div>
  );
}
