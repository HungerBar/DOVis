import {
  useLayoutEffect,
  useRef,
} from 'react';

import CesiumEngine from '../engine/CesiumEngine';

export default function CesiumViewer({
  onReady,
  onDestroy,
}) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const engine = new CesiumEngine(
      containerRef.current
    );

    const viewer = engine.getViewer();

    onReady?.(viewer);

    return () => {
      engine.destroy();

      onDestroy?.();
    };
  }, [onDestroy, onReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}
