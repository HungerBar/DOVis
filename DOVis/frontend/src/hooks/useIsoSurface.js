import { useState, useCallback } from 'react';
import { useTimes, useVolume } from './useData';

export default function useIsoSurface() {
  // =========================
  // Time / isoValue
  // =========================
  const times = useTimes();
  const [timeIndex, setTimeIndex] = useState(0);
  const [isoValue, setIsoValue] = useState(200);

  // =========================
  // Volume Data
  // =========================
  const {
    volume,
    shape,
    loading,
    error,
  } = useVolume(timeIndex);

  // =========================
  // Export iso surface field (.nc)
  // =========================
  const handleExportNc = useCallback(async () => {
    try {
      const url = `/api/export_iso_surface_field?time_index=${timeIndex}&iso_value=${isoValue}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Export failed: HTTP ${res.status}`);
      }

      const blob = await res.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `iso_depth_t${timeIndex}_v${isoValue}.nc`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('handleExportNc error:', err);
    }
  }, [timeIndex, isoValue]);

  // =========================
  // Return
  // =========================
  return {
    times,

    timeIndex,
    setTimeIndex,

    isoValue,
    setIsoValue,

    volume,
    shape,
    loading,
    error,

    handleExportNc,
  };
}