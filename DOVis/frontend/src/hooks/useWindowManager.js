import { useRef, useState } from 'react';
import { WindowPolicy } from '../config/WindowPolicy';

export function useWindowManager() {
  const zRef = useRef(1000);
  const [windows, setWindows] = useState([]);

  const focus = (id) => {
    zRef.current += 1;

    setWindows(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, zIndex: zRef.current }
          : w
      )
    );
  };

  const open = ({ id, Component, props = {}, policy = {} }) => {
    zRef.current += 1;

    setWindows(prev => {
      const exist = prev.find(w => w.id === id);

      if (exist) {
        return prev.map(w =>
          w.id === id
            ? { ...w, visible: true, zIndex: zRef.current }
            : w
        );
      }

      const p = WindowPolicy.apply(policy);

      return [
        ...prev,
        {
          id,
          Component,
          props,

          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,

          minWidth: p.minWidth,
          minHeight: p.minHeight,

          resizable: p.resizable,
          draggable: p.draggable,

          visible: true,
          maximized: false,
          prevBounds: null,
          zIndex: zRef.current,
        },
      ];
    });
  };

  const hidden = (id) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, visible: false } : w
      )
    );
  };

  const maximize = (id) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            x: w.prevBounds.x,
            y: w.prevBounds.y,
            width: w.prevBounds.width,
            height: w.prevBounds.height,
            prevBounds: null,
          };
        }
        return {
          ...w,
          maximized: true,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0,
          y: 56,
          width: window.innerWidth,
          height: window.innerHeight - 56,
        };
      })
    );
  };

  const update = (id, patch) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, ...patch } : w
      )
    );
  };

  return { windows, open, hidden, update, focus, maximize };
}