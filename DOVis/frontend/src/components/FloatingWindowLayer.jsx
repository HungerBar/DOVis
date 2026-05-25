const styles = {
  window: {
    position: 'absolute',
    background: '#0b1220',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  },

  header: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    background: '#1e293b',
    cursor: 'grab',
    color: '#fff',
    fontSize: '12px',
    userSelect: 'none',
  },
};

export function FloatingWindowLayer({
  windows,
  onClose,
  onUpdate,
  onFocus,
}) {
  return (
    <>
      {windows
        .filter(w => w.visible)
        .map(win => {
          const Comp = win.Component;

          return (
            <div
              key={win.id}
              style={{
                ...styles.window,
                left: win.x,
                top: win.y,
                width: win.width,
                height: win.height,
                zIndex: win.zIndex,
              }}
              onMouseDown={() => onFocus(win.id)}
            >
              {/* Drag Header */}
              <div
                style={styles.header}
                onMouseDown={(e) => {
                  const sx = e.clientX;
                  const sy = e.clientY;

                  const ox = win.x;
                  const oy = win.y;

                  const move = (ev) => {
                    onUpdate(win.id, {
                      x: ox + ev.clientX - sx,
                      y: oy + ev.clientY - sy,
                    });
                  };

                  const up = () => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                  };

                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              >
                <span>{win.id}</span>

                <button
                  onClick={() => onClose(win.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div style={{ height: 'calc(100% - 36px)' }}>
                <Comp {...win.props} />
              </div>
            </div>
          );
        })}
    </>
  );
}