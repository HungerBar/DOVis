import { useMemo, useState } from 'react';
import {
  ApiOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';

import CesiumAPIProvider from '../api/CesiumAPIProvider';
import cinematicOcean from '../assets/cinematic-ocean-oxygen.png';
import { moduleConfig } from '../config/module';
import { FloatingWindowLayer } from './FloatingWindowLayer';
import CesiumViewer from './CesiumViewer';
import ModuleLauncher from './ModuleLauncher';
import { useWindowManager } from '../hooks/useWindowManager';

const metrics = [
  { label: 'Oxygen mean', value: '186.4', unit: 'mmol/m3', tone: 'cyan' },
  { label: 'Active depth', value: '600', unit: 'm', tone: 'amber' },
  { label: 'Hypoxic volume', value: '14.7', unit: '%', tone: 'coral' },
  { label: 'EOF signal', value: 'Mode 03', unit: '72%', tone: 'violet' },
];

const timeline = ['1993', '2001', '2009', '2017', '2026'];

function AppShell() {
  const [viewer, setViewer] = useState(null);
  const [sceneMode, setSceneMode] = useState('mission');

  const { windows, open, hidden, update, focus } = useWindowManager();

  const openModule = useMemo(() => {
    return (module) => {
      open({
        id: module.id,
        Component: module.component,
        props: {
          ...(module.props || {}),
          hidden: () => hidden(module.id),
        },
      });
    };
  }, [hidden, open]);

  return (
    <div className="dovis-shell">
      <div
        className="dovis-poster"
        style={{ backgroundImage: `url(${cinematicOcean})` }}
      />

      <div className="cesium-stage">
        <CesiumViewer
          onReady={(v) => setViewer(v)}
          onDestroy={() => setViewer(null)}
        />
      </div>

      <div className="vignette-layer" />
      <div className="scanline-layer" />

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">DO</span>
          <div>
            <h1>DOVis</h1>
            <p>Dissolved Oxygen Visualization</p>
          </div>
        </div>

        <div className="mode-switch" role="group" aria-label="Scene mode">
          {['mission', 'analysis', 'export'].map((mode) => (
            <button
              key={mode}
              className={sceneMode === mode ? 'active' : ''}
              onClick={() => setSceneMode(mode)}
              title={`Switch to ${mode}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="connection-pill">
          <CloudSyncOutlined />
          <span>{viewer ? 'Cesium online' : 'Initializing'}</span>
        </div>
      </header>

      <aside className="mission-panel">
        <div className="section-kicker">
          <RadarChartOutlined />
          <span>Global ocean watch</span>
        </div>
        <h2>Oxygen fields from surface to 6000 m</h2>
        <p>
          GLOBAL_MULTIYEAR_BGC_001_029 is staged for isosurface rendering,
          vertical sections, hypoxic boundary analysis, and export workflows.
        </p>

        <div className="metric-grid">
          {metrics.map((metric) => (
            <div className={`metric-chip ${metric.tone}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.unit}</small>
            </div>
          ))}
        </div>

        <div className="depth-console">
          <div className="console-head">
            <DashboardOutlined />
            <span>Depth console</span>
          </div>
          <input
            aria-label="Depth"
            min="0"
            max="6000"
            step="50"
            defaultValue="600"
            type="range"
          />
          <div className="depth-readout">
            <span>0 m</span>
            <strong>600 m</strong>
            <span>6000 m</span>
          </div>
        </div>
      </aside>

      <section className="telemetry-strip" aria-label="Dataset telemetry">
        {timeline.map((item, index) => (
          <div className="telemetry-node" key={item}>
            <span>{item}</span>
            <strong>{index === 4 ? 'M-2' : 'daily/monthly'}</strong>
          </div>
        ))}
      </section>

      <div className="cinema-readout">
        <div>
          <FieldTimeOutlined />
          <span>Temporal resolution</span>
        </div>
        <strong>Daily to monthly means</strong>
      </div>

      <ModuleLauncher
        modules={moduleConfig}
        onOpen={openModule}
        hidden={hidden}
      />

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
            onClose={hidden}
            onUpdate={update}
            onFocus={focus}
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
