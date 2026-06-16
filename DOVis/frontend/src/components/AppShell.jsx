import { useCallback, useMemo, useState } from 'react';
import {
  ApiOutlined,
  CloudSyncOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

import CesiumAPIProvider from '../api/CesiumAPIProvider';
import cinematicOcean from '../assets/cinematic-ocean-oxygen.png';
import { moduleConfig } from '../config/module';
import { FloatingWindowLayer } from './FloatingWindowLayer';
import CesiumViewer from './CesiumViewer';
import ModuleLauncher from './ModuleLauncher';
import { useWindowManager } from '../hooks/useWindowManager';

function AppShell() {
  const [viewer, setViewer] = useState(null);

  const { windows, open, hidden, close, update, focus, maximize, snapLeft, snapRight, registerCleanup } = useWindowManager();

  const handleViewerReady = useCallback((v) => {
    setViewer(v);
  }, []);

  const handleViewerDestroy = useCallback(() => {
    setViewer(null);
  }, []);

  const openModule = useMemo(() => {
    return (module) => {
      open({
        id: module.id,
        Component: module.component,
        props: {
          ...(module.props || {}),
          hidden: () => hidden(module.id),
          registerCleanup: (fn) => registerCleanup(module.id, fn),
        },
        policy: module.policy || {},
      });
    };
  }, [hidden, open, registerCleanup]);

  return (
    <div className="dovis-shell">
      <div
        className="dovis-poster"
        style={{ backgroundImage: `url(${cinematicOcean})` }}
      />

      <div className="cesium-stage">
        <CesiumViewer
          onReady={handleViewerReady}
          onDestroy={handleViewerDestroy}
        />
      </div>

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">DO</span>
          <div>
            <h1>DOVis</h1>
            <p>Dissolved Oxygen Visualization</p>
          </div>
        </div>

        <ModuleLauncher
          modules={moduleConfig}
          onOpen={openModule}
        />

        <div className="connection-pill">
          <CloudSyncOutlined />
          <span>{viewer ? 'Cesium online' : 'Initializing'}</span>
        </div>
      </header>

      {!viewer && (
        <div className="loading-slate">
          <ExperimentOutlined />
          <span>Loading ocean scene</span>
        </div>
      )}

      {viewer && (
        <CesiumAPIProvider viewer={viewer}>
          <FloatingWindowLayer
            windows={windows}
            onMinimize={hidden}
            onClose={close}
            onUpdate={update}
            onFocus={focus}
            onMaximize={maximize}
            onSnapLeft={snapLeft}
            onSnapRight={snapRight}
          />
        </CesiumAPIProvider>
      )}

      <div className="api-badge">
        <ApiOutlined />
        <span>API 5001</span>
      </div>
    </div>
  );
}

export default AppShell;
