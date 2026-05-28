import '../UI/floatingWindow.css'

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
              {/* DRAG HEADER */}
              {w.draggable !== false && (
                <div
                  className="header"
                  onMouseDown={(e) => {
                    e.preventDefault();

                    const sx = e.clientX;
                    const sy = e.clientY;

                    const ox = w.x;
                    const oy = w.y;

                    const move = (ev) => {
                      onUpdate(w.id, {
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
                  <span>{w.id}</span>

                  {/* centered hidden button */}
                  <button
                    className="hiddenBtn"
                    onClick={() => onClose(w.id)}
                  >
                    hidden
                  </button>

                </div>
              )}

              {/* CONTENT */}
              <div className="content" style={{ height: 'calc(100% - 36px)' }}>
                <Comp {...w.props} />
              </div>

              {/* RESIZE HANDLE */}
              {w.resizable !== false && (
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

                      onUpdate(w.id, {
                        width: newW,
                        height: newH,
                      });
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