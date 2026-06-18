import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AppShell from './components/AppShell';

function App() {
  const [phase, setPhase] = useState('landing');

  return (
    <>
      {phase === 'landing' && (
        <LandingPage onEnter={() => setPhase('transitioning')} />
      )}

      {phase === 'transitioning' && (
        <div
          className="transition-overlay"
          onAnimationEnd={() => setPhase('app')}
        />
      )}

      <div style={{
        position: 'fixed',
        inset: 0,
        opacity: phase === 'app' ? 1 : 0,
        zIndex: phase === 'app' ? 0 : -1,
        pointerEvents: phase === 'app' ? 'auto' : 'none',
      }}>
        <AppShell />
      </div>
    </>
  );
}

export default App;
