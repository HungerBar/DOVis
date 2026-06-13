/* eslint-disable react-hooks/refs */
import {
  useMemo,
  useRef,
} from 'react';

import CesiumAPIContext from '../context/CesiumAPIContext';
import { createCesiumApi } from '../engine/createCesiumApi';

export default function CesiumAPIProvider({
  viewer,
  children,
}) {
  const rendererRef = useRef(null);
  const entitiesRef = useRef(new Set());
  const handlerRef = useRef(null);

  const api = useMemo(() => {
    if (!viewer) return null;

    return createCesiumApi({
      viewer,
      rendererRef,
      entitiesRef,
      handlerRef,
    });
  }, [viewer]);

  return (
    <CesiumAPIContext.Provider value={api}>
      {children}
    </CesiumAPIContext.Provider>
  );
}
