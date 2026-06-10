import '../UI/floatingWindow.css'

const SNAP_THRESHOLD = 8;

function clampToViewport(win) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(win.width, vw);
  const height = Math.min(win.height, vh);
  const x = Math.min(Math.max(0, win.x), vw - width);
  const y = Math.min(Math.max(0, win.y), vh - height);
  return { ...win, x, y, width, height };
}

export function FloatingWindowLayer({
  windows,
  onClose,
  onUpdate,
  onFocus,
  onMaximize,
  onSnapLeft,
  onSnapRight,
}) {
  return (
    <>
      {windows
        .filter(w => w.visible)
        .map(win => {
          const Comp = win.Component;
          const w = clampToViewport(win);

          return (
            <div
              key={w.id}
              className="window"
              style={{
                left: w.x,
                top: w.y,
                width: w.width,
                height: w.height,
                zIndex: w.zIndex,
              }}
              onMouseDown={() => onFocus(w.id)}
            >
              {/* TITLE BAR */}
              {w.draggable !== false && (
                <div
                  className="header"
                  onDoubleClick={() => onMaximize(w.id)}
                  onMouseDown={(e) => {
                    if (e.target.closest('.windowControls')) return;
                    e.preventDefault();

                    const sx = e.clientX;
                    const sy = e.clientY;
                    const ox = w.x;
                    const oy = w.y;
                    const wasSnapped = w.maximized || w.snapped;

                    const move = (ev) => {
                      let nx = ox + ev.clientX - sx;
                      let ny = oy + ev.clientY - sy;

                      if (wasSnapped && (Math.abs(ev.clientX - sx) > 20 || Math.abs(ev.clientY - sy) > 20)) {
                        if (w.prevBounds) {
                          const restored = w.prevBounds;
                          nx = ev.clientX - restored.width / 2;
                          ny = ev.clientY - 16;
                          onUpdate(w.id, {
                            x: nx, y: ny,
                            width: restored.width, height: restored.height,
                            maximized: false, snapped: null,
                            prevBounds: null,
                          });
                          return;
                        }
                      }

                      onUpdate(w.id, { x: nx, y: ny });
                    };

                    const up = (ev) => {
                      window.removeEventListener('mousemove', move);
                      window.removeEventListener('mouseup', up);

                      const finalX = ev.clientX;
                      const finalY = ev.clientY;
                      const vw = window.innerWidth;

                      if (finalY <= SNAP_THRESHOLD) {
                        onMaximize(w.id);
                      } else if (finalX <= SNAP_THRESHOLD) {
                        onSnapLeft(w.id);
                      } else if (finalX >= vw - SNAP_THRESHOLD) {
                        onSnapRight(w.id);
                      }
                    };

                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                  }}
                >
                  <span className="windowTitle">{w.id}</span>

                  <div className="windowControls">
                    <button
                      className="winBtn winMin"
                      onClick={() => onClose(w.id)}
                      aria-label="Minimize"
                    >
                      &#x2014;
                    </button>
                    <button
                      className="winBtn winMax"
                      onClick={() => onMaximize(w.id)}
                      aria-label="Maximize"
                    >
                      {w.maximized ? '⧉' : '□'}
                    </button>
                    <button
                      className="winBtn winClose"
                      onClick={() => onClose(w.id)}
                      aria-label="Close"
                    >
                      &#x2715;
                    </button>
                  </div>
                </div>
              )}

              {/* CONTENT */}
              <div className="content" style={{ height: 'calc(100% - 32px)' }}>
                <Comp {...w.props} />
              </div>

              {/* RESIZE HANDLE */}
              {w.resizable !== false && !w.maximized && !w.snapped && (
                <div
                  className="resizeHandle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sx = e.clientX;
                    const sy = e.clientY;
                    const ow = w.width;
                    const oh = w.height;
                    const minW = w.minWidth;
                    const minH = w.minHeight;

                    const move = (ev) => {
                      const newW = Math.max(minW, ow + ev.clientX - sx);
                      const newH = Math.max(minH, oh + ev.clientY - sy);
                      onUpdate(w.id, { width: newW, height: newH });
                    };

                    const up = () => {
                      window.removeEventListener('mousemove', move);
                      window.removeEventListener('mouseup', up);
                    };

                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                  }}
                />
              )}
            </div>
          );
        })}
    </>
  );
}
