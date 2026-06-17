const DEFAULT_PERCENTILE = 0.9;

function quantile(values, q) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] === undefined) {
    return sorted[base];
  }

  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function buildBounds(coords) {
  return coords.map((coord, index) => {
    const prev = coords[index - 1];
    const next = coords[index + 1];
    const lower = prev == null ? coord - (next - coord) / 2 : (prev + coord) / 2;
    const upper = next == null ? coord + (coord - prev) / 2 : (coord + next) / 2;
    return [Math.min(lower, upper), Math.max(lower, upper)];
  });
}

export function buildFirstModeHighValueCells(
  result,
  percentile = DEFAULT_PERCENTILE
) {
  if (!result || result.mode_type !== 'horizontal') {
    throw new Error('EOF high-value Cesium overlay only supports horizontal mode.');
  }

  const firstMode = result.modes?.[0];
  const lat = result.coords?.lat?.map(Number);
  const lon = result.coords?.lon?.map(Number);

  if (!firstMode?.field || !lat?.length || !lon?.length) {
    throw new Error('EOF result does not contain a horizontal field with lat/lon coordinates.');
  }

  const validValues = firstMode.field
    .flat()
    .filter((value) => Number.isFinite(value));
  const threshold = quantile(validValues, percentile);

  if (!Number.isFinite(threshold)) {
    throw new Error('EOF first mode has no valid values to render.');
  }

  const latBounds = buildBounds(lat);
  const lonBounds = buildBounds(lon);
  const cells = [];

  firstMode.field.forEach((row, latIndex) => {
    row.forEach((value, lonIndex) => {
      if (!Number.isFinite(value) || value < threshold) return;

      const [south, north] = latBounds[latIndex];
      const [west, east] = lonBounds[lonIndex];

      cells.push({
        west,
        south,
        east,
        north,
        value,
      });
    });
  });

  if (!cells.length) {
    throw new Error('No first-mode high-value cells were found.');
  }

  return {
    cells,
    threshold,
    cellCount: cells.length,
    variance: firstMode.variance,
  };
}
