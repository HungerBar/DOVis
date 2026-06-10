import { useRef, useState } from 'react';
import { WindowPolicy } from '../config/WindowPolicy';

const TOPBAR_H = 52;

export function useWindowManager() {
  const zRef = useRef(1000);
  const [windows, setWindows] = useState([]);

  const focus = (id) => {
    zRef.current += 1;
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, zIndex: zRef.current } : w)
    );
  };

  const open = ({ id, Component, props = {}, policy = {} }) => {
    zRef.current += 1;
    setWindows(prev => {
      const exist = prev.find(w => w.id === id);
      if (exist) {
        return prev.map(w =>
          w.id === id ? { ...w, visible: true, zIndex: zRef.current } : w
        );
      }
      const p = WindowPolicy.apply(policy);
      return [
        ...prev,
        {
          id, Component, props,
          x: p.x, y: p.y, width: p.width, height: p.height,
          minWidth: p.minWidth, minHeight: p.minHeight,
          resizable: p.resizable, draggable: p.draggable,
          visible: true, maximized: false, snapped: null, prevBounds: null,
          zIndex: zRef.current,
        },
      ];
    });
  };

  const hidden = (id) => {
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, visible: false } : w)
    );
  };

  const maximize = (id) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        if (w.maximized || w.snapped) {
          return {
            ...w, maximized: false, snapped: null,
            x: w.prevBounds.x, y: w.prevBounds.y,
            width: w.prevBounds.width, height: w.prevBounds.height,
            prevBounds: null,
          };
        }
        return {
          ...w, maximized: true, snapped: null,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0, y: TOPBAR_H,
          width: window.innerWidth, height: window.innerHeight - TOPBAR_H,
        };
      })
    );
  };

  const snapLeft = (id) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        const bounds = w.prevBounds || { x: w.x, y: w.y, width: w.width, height: w.height };
        return {
          ...w, maximized: false, snapped: 'left',
          prevBounds: w.snapped || w.maximized ? w.prevBounds : bounds,
          x: 0, y: TOPBAR_H,
          width: Math.floor(window.innerWidth / 2),
          height: window.innerHeight - TOPBAR_H,
        };
      })
    );
  };

  const snapRight = (id) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        const bounds = w.prevBounds || { x: w.x, y: w.y, width: w.width, height: w.height };
        return {
          ...w, maximized: false, snapped: 'right',
          prevBounds: w.snapped || w.maximized ? w.prevBounds : bounds,
          x: Math.ceil(window.innerWidth / 2), y: TOPBAR_H,
          width: Math.floor(window.innerWidth / 2),
          height: window.innerHeight - TOPBAR_H,
        };
      })
    );
  };

  const update = (id, patch) => {
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, ...patch } : w)
    );
  };

  return { windows, open, hidden, update, focus, maximize, snapLeft, snapRight };
}
