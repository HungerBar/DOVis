import EOFControlPanel from '../components/eofControlPanel';

export default function EOFModule({ hidden }) {

  return (
    <div>

      <button
        style={{
          position: 'absolute',
          top: 1,
          right: 1,
          zIndex: 5,
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
        }}
        onClick={hidden}
      >
        x
      </button>

      <div
        style={{
          display: 'flex',
          height: '100%',
          background: '#0b1220',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* 左侧控制面板 */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
          }}
        >
          <EOFControlPanel />
        </div>

        {/* 右侧结果区 */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <h2>EOF Result Area</h2>
        </div>

      </div>
    </div>
  );
}