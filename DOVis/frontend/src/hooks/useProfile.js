import { useState, useEffect, useCallback, useRef } from 'react';
import useCesiumAPI from './useCesiumAPI';

export default function useProfile() {
  const api = useCesiumAPI();

  const [times, setTimes] = useState([]);
  const [timeIndex, setTimeIndex] = useState(0);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('vertical'); // 'vertical' | 'section'
  const [sectionPoints, setSectionPoints] = useState([]);
  const [sectionData, setSectionData] = useState(null);

  const handlerRef = useRef(null);

  // Fetch times list
  useEffect(() => {
    fetch('/api/times')
      .then((r) => r.json())
      .then((data) => setTimes(data))
      .catch(() => {});
  }, []);

  // Register Cesium click handler
  useEffect(() => {
    if (!api?.registerClickHandler) return;

    handlerRef.current = api.registerClickHandler((pos) => {
      if (mode === 'section') {
        setSectionPoints((prev) => [...prev, pos]);
      } else {
        setSelectedPoint(pos);
      }
    });

    return () => {
      if (handlerRef.current?.destroy) {
        handlerRef.current.destroy();
      }
    };
  }, [api, mode]);

  // Fetch vertical profile when point or time changes
  useEffect(() => {
    if (!selectedPoint) return;

    setLoading(true);
    setError(null);

    fetch(
      `/api/profile/vertical?lat=${selectedPoint.lat}&lon=${selectedPoint.lon}&time_index=${timeIndex}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setProfileData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedPoint, timeIndex]);

  // Fetch section when sectionPoints or time changes
  const fetchSection = useCallback(async () => {
    if (sectionPoints.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: sectionPoints,
          time_index: timeIndex,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setSectionData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sectionPoints, timeIndex]);

  // Auto-refresh section when timeIndex changes (if already loaded)
  useEffect(() => {
    if (sectionData && sectionPoints.length >= 2) {
      fetchSection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeIndex]);

  const reset = useCallback(() => {
    setSelectedPoint(null);
    setProfileData(null);
    setSectionPoints([]);
    setSectionData(null);
    setError(null);
  }, []);

  const clearSectionPoints = useCallback(() => {
    setSectionPoints([]);
    setSectionData(null);
  }, []);

  return {
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
  };
}
