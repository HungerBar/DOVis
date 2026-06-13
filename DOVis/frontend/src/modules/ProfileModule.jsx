import { useEffect } from 'react';
import ProfileControlPanel from '../components/ProfileControlPanel';
import ProfileChart from '../components/ProfileChart';
import SectionChart from '../components/SectionChart';
import useProfile from '../hooks/useProfile';

export default function ProfileModule({ registerCleanup }) {
  const {
    times,
    timeIndex,
    setTimeIndex,

    selectedPoint,
    profileData,
    loading,
    error,

    mode,
    setMode,

    sectionPoints,
    sectionData,
    sectionError,
    fetchSection,
    clearSectionPoints,

    cleanup,
  } = useProfile();

  useEffect(() => {
    registerCleanup?.(() => cleanup());
  }, [registerCleanup, cleanup]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          background: 'rgba(38, 37, 35, 0.95)',
          color: '#F0F0F0',
          overflow: 'hidden',
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: 250,
            flexShrink: 0,
          }}
        >
          <ProfileControlPanel
            times={times}
            timeIndex={timeIndex}
            setTimeIndex={setTimeIndex}
            selectedPoint={selectedPoint}
            mode={mode}
            setMode={setMode}
            sectionPoints={sectionPoints}
            sectionError={sectionError}
            fetchSection={fetchSection}
            clearSectionPoints={clearSectionPoints}
          />
        </div>

        {/* Right Chart */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            minWidth: 0,
          }}
        >
          {mode === 'vertical' ? (
            <ProfileChart
              profileData={profileData}
              loading={loading}
              error={error}
            />
          ) : (
            <SectionChart
              sectionData={sectionData}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
