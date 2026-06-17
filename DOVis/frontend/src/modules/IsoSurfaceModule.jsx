import { useState, useEffect } from 'react';

import IsoSurfaceRenderer from '../components/IsoSurfaceRenderer';
import IsoSurfaceControlPanel from '../components/IsoSurfaceControlPanel';

import useIsoSurface from '../hooks/useIsoSurface';
import useCesiumTiles from '../hooks/useCesiumTiles';

export default function IsoSurfaceModule({ registerCleanup }) {
  const {
    times,
    timeIndex,
    setTimeIndex,

    isoValue,
    setIsoValue,

    volume,
    shape,
    loading,

    handleExportNc,
  } = useIsoSurface();

  const {
    load,
    reset,
    loading: tilesLoading,
    error: tilesError,
  } = useCesiumTiles(
    timeIndex,
    isoValue
  );

  const [previewVisible, setPreviewVisible] = useState(true);
  const [renderActive, setRenderActive] = useState(false);

  useEffect(() => {
    if (!renderActive) return;

    load();
  }, [renderActive, load]);

  useEffect(() => {
    registerCleanup?.(() => {
      setRenderActive(false);
      reset();
    });
  }, [registerCleanup, reset]);

  const handleRenderCesium = async () => {
    if (renderActive) {
      await load();
      return;
    }

    setRenderActive(true);

    // 渲染到 Cesium 后自动隐藏右侧预览
    // setPreviewVisible(false);
  };

  const handleEndRenderCesium = () => {
    setRenderActive(false);
    reset();

    // 结束 Cesium 渲染后恢复右侧预览
    setPreviewVisible(true);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: previewVisible ? '100%' : '320px',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: previewVisible ? '100%' : '320px',
          background: 'rgba(38, 37, 35, 0.95)',
          color: '#F0F0F0',
          overflow: 'hidden',
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
          }}
        >
          <IsoSurfaceControlPanel
            times={times}
            timeIndex={timeIndex}
            setTimeIndex={setTimeIndex}
            isoValue={isoValue}
            setIsoValue={setIsoValue}
            onRenderCesium={handleRenderCesium}
            endRenderCesium={handleEndRenderCesium}
            onExportNc={handleExportNc}
            renderActive={renderActive}
            renderLoading={tilesLoading}
            renderError={tilesError}
          />
        </div>

        {/* Right Render */}
        {previewVisible && (
          <div
            style={{
              flex: 1,
              position: 'relative',
              minWidth: 0,
            }}
          >
            <IsoSurfaceRenderer
              volume={volume}
              shape={shape}
              isoValue={isoValue}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
