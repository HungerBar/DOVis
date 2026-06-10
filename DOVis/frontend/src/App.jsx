import { useState, lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage';

const AppShell = lazy(() => import('./components/AppShell'));

function App() {
  const [phase, setPhase] = useState('landing');

  if (phase === 'landing') {
    return <LandingPage onEnter={() => setPhase('transitioning')} />;
  }

  if (phase === 'transitioning') {
    return (
      <>
        <div
          className="transition-overlay"
          onAnimationEnd={() => setPhase('app')}
        />
        <Suspense fallback={null}>
          <AppShell />
        </Suspense>
      </>
    );
  }

  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}

export default App;
