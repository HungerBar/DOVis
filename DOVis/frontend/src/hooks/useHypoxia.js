import { useState, useCallback } from 'react';
import { useTimes } from './useData';

export default function useHypoxia() {
  const times = useTimes();
  const [timeIndex, setTimeIndex] = useState(0);
  const [threshold, setThreshold] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExportNc = useCallback(async () => {
    try {
      const url = `/api/hypoxia/export_boundary_nc?time_index=${timeIndex}&threshold=${threshold}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Export failed: HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `hypoxia_boundary_t${timeIndex}_th${threshold}.nc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('handleExportNc error:', err);
      setError(err.message);
    }
  }, [timeIndex, threshold]);

  return {
    times,
    timeIndex,
    setTimeIndex,
    threshold,
    setThreshold,
    loading,
    setLoading,
    error,
    handleExportNc,
  };
}
