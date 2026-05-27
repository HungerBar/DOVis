import { useState } from 'react';

import CesiumViewer from './CesiumViewer';
import ModuleLauncher from './ModuleLauncher';

import { moduleConfig } from '../config/module';

import { useWindowManager } from '../hooks/useWindowManager';
import { FloatingWindowLayer } from './FloatingWindowLayer';

import CesiumAPIProvider from '../api/CesiumAPIProvider';

function AppShell() {
  // ✔ 唯一 Cesium Viewer source
  const [viewer, setViewer] = useState(null);

  // ✔ window manager
  const {
    windows,
    open,
    close,
    update,
    focus,
  } = useWindowManager();

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ======================================
          Cesium Background
      ====================================== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        <CesiumViewer
          onReady={(v) => {
            console.log('[Cesium] ready');

            setViewer(v);
          }}
          onDestroy={() => {
            console.log('[Cesium] destroyed');

            setViewer(null);
          }}
        />
      </div>

      {/* ======================================
          Cesium API Layer
      ====================================== */}
      {viewer && (
        <CesiumAPIProvider viewer={viewer}>
          {/* ======================================
              Launcher
          ====================================== */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 1000,
            }}
          >
            <ModuleLauncher
              modules={moduleConfig}
              onOpen={open}
            />
          </div>

          {/* ======================================
              Window System
          ====================================== */}
          <FloatingWindowLayer
            windows={windows}
            onClose={close}
            onUpdate={update}
            onFocus={focus}
          />
        </CesiumAPIProvider>
      )}
    </div>
  );
}

export default AppShell;