import { useRef, useState } from 'react';

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

  const open = ({ id, Component, props = {} }) => {
    zRef.current += 1;

    setWindows(prev => {
      const exist = prev.find(w => w.id === id);

      if (exist) {
        return prev.map(w =>
          w.id === id
            ? {
              ...w,
              visible: true,
              zIndex: zRef.current,
            }
            : w
        );
      }

      return [
        ...prev,
        {
          id,
          Component,
          props,
          x: 120,
          y: 120,
          width: 700,
          height: 700,
          visible: true,
          zIndex: zRef.current,
        },
      ];
    });
  };

  const close = (id) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, visible: false } : w
      )
    );
  };

  const update = (id, patch) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, ...patch } : w
      )
    );
    
  };

  return { windows, open, close, update, focus };
}