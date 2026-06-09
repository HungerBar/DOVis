import ProfileControlPanel from '../components/ProfileControlPanel';
import ProfileChart from '../components/ProfileChart';
import SectionChart from '../components/SectionChart';
import useProfile from '../hooks/useProfile';

export default function ProfileModule({ hidden }) {
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
    fetchSection,
    clearSectionPoints,

    reset,
  } = useProfile();

  const handleClose = () => {
    reset();
    hidden();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Close button */}
      <button
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 30,
          background: 'rgba(30,41,59,0.6)',
          border: '1px solid rgba(148,163,184,0.2)',
          color: '#94a3b8',
          cursor: 'pointer',
          width: 24,
          height: 24,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          padding: 0,
        }}
        onClick={handleClose}
      >
        x
      </button>

      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          background: '#0b1220',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: 280,
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
