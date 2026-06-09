import { useRef, useEffect, useState } from 'react';

const COLORMAP = [
  [0.00, 15, 32, 80],
  [0.15, 27, 84, 136],
  [0.30, 36, 152, 168],
  [0.45, 46, 190, 140],
  [0.60, 120, 210, 80],
  [0.75, 220, 200, 40],
  [0.88, 230, 130, 30],
  [1.00, 200, 40, 50],
];

function interpColor(t) {
  t = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < COLORMAP.length - 2 && COLORMAP[i + 1][0] < t) i++;
  const a = COLORMAP[i];
  const b = COLORMAP[i + 1];
  const f = (t - a[0]) / ((b[0] - a[0]) || 0.001);
  const fc = Math.max(0, Math.min(1, f));
  const r = Math.round(a[1] + (b[1] - a[1]) * fc);
  const g = Math.round(a[2] + (b[2] - a[2]) * fc);
  const bl = Math.round(a[3] + (b[3] - a[3]) * fc);
  return [r, g, bl];
}

function colorToString(c) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const LAYERS = [
  [0, 200, 'Mixed Layer'],
  [200, 1000, 'Thermocline / OMZ'],
  [1000, 99999, 'Deep Water'],
];

function buildGrid(section) {
  const distSet = [...new Set(section.map((p) => p.distance_km))].sort((a, b) => a - b);
  const depthSet = [...new Set(section.map((p) => p.depth))].sort((a, b) => a - b);
  const lookup = {};
  for (const p of section) lookup[`${p.distance_km}|${p.depth}`] = p.oxygen;
  const grid = depthSet.map((d) => distSet.map((dist) => lookup[`${dist}|${d}`] ?? NaN));
  return { grid, distSet, depthSet };
}

function bilinear(grid, depthSet, distSet, dist, depth) {
  let di = 0;
  while (di < depthSet.length && depthSet[di] < depth) di++;
  let xi = 0;
  while (xi < distSet.length && distSet[xi] < dist) xi++;

  // Clamp to grid bounds instead of returning NaN
  di = Math.max(1, Math.min(di, depthSet.length - 1));
  xi = Math.max(1, Math.min(xi, distSet.length - 1));

  const d0 = di - 1, d1 = di, x0 = xi - 1, x1 = xi;
  const v00 = grid[d0]?.[x0], v01 = grid[d1]?.[x0];
  const v10 = grid[d0]?.[x1], v11 = grid[d1]?.[x1];

  // Fall back to nearest valid neighbor if any corner is NaN
  const vs = [v00, v01, v10, v11].filter((v) => v !== undefined && !isNaN(v));
  if (vs.length === 0) return NaN;
  if (vs.length < 4) return vs[0];

  const fy = (depth - depthSet[d0]) / ((depthSet[d1] - depthSet[d0]) || 1);
  const fx = (dist - distSet[x0]) / ((distSet[x1] - distSet[x0]) || 1);
  return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
}

export default function SectionChart({ sectionData, loading, error }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [resizeKey, setResizeKey] = useState(0);
  const [hover, setHover] = useState(null);
  const layoutRef = useRef({});

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => setResizeKey((k) => k + 1));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const dpr = window.devicePixelRatio;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, W, H);

    if (loading || error || !sectionData?.section?.length) {
      ctx.fillStyle = loading ? '#94a3b8' : error ? '#f87171' : '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        loading ? 'Loading...' : error ? `Error: ${error}` : 'Click points, then "Analyze Section"',
        W / 2, H / 2
      );
      return;
    }

    let { section } = sectionData;
    section = section.filter((p) => p.oxygen != null && !isNaN(p.oxygen));
    if (!section.length) return;
    const { grid, distSet, depthSet } = buildGrid(section);
    const oxygens = section.map((p) => p.oxygen);
    let minO2 = Math.min(...oxygens);
    let maxO2 = Math.max(...oxygens);
    const pad = (maxO2 - minO2) * 0.05 || 5;
    minO2 -= pad;
    maxO2 += pad;
    const o2Range = maxO2 - minO2;
    const maxDist = distSet[distSet.length - 1] || 1;
    const maxDepth = depthSet[depthSet.length - 1] || 1;

    // --- layout ---
    const COLORBAR_W = 16;
    const COLORBAR_GAP = 10;
    const RIGHT_PAD = 10;
    const left = 72;
    const right = COLORBAR_GAP + COLORBAR_W + 36 + RIGHT_PAD;
    const top = 20;
    const bottom = 48;
    const pw = W - left - right;
    const ph = H - top - bottom;
    if (pw <= 0 || ph <= 0) return;

    // Store layout for mouse handler
    layoutRef.current = { left, right, top, bottom, pw, ph, maxDist, maxDepth, grid, distSet, depthSet, minO2, o2Range };

    const xf = (d) => left + (d / maxDist) * pw;
    const yf = (dep) => top + (dep / maxDepth) * ph;

    // --- heatmap (render at plot resolution) ---
    const hiW = Math.min(Math.round(pw), 600);
    const hiH = Math.min(Math.round(ph), 500);
    const img = ctx.createImageData(hiW, hiH);

    for (let iy = 0; iy < hiH; iy++) {
      const depth = (iy / (hiH - 1 || 1)) * maxDepth;
      for (let ix = 0; ix < hiW; ix++) {
        const dist = (ix / (hiW - 1 || 1)) * maxDist;
        const val = bilinear(grid, depthSet, distSet, dist, depth);
        if (isNaN(val)) continue;
        const t = (val - minO2) / o2Range;
        const [r, g, b] = interpColor(t);
        const idx = (iy * hiW + ix) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }

    // Draw image directly at plot size
    const offCanvas = document.createElement('canvas');
    offCanvas.width = hiW;
    offCanvas.height = hiH;
    const offCtx = offCanvas.getContext('2d');
    offCtx.putImageData(img, 0, 0);
    ctx.drawImage(offCanvas, left, top, pw, ph);

    // --- layer tint bands & labels ---
    const layerColors = ['#38bdf8', '#fbbf24', '#818cf8'];
    for (let li = 0; li < LAYERS.length; li++) {
      const [ly0, ly1, label] = LAYERS[li];
      const ey0 = yf(ly0);
      const ey1 = yf(Math.min(ly1, maxDepth));
      if (ey1 <= ey0) continue;
      // subtle tint
      ctx.fillStyle = 'rgba(148,163,184,0.03)';
      ctx.fillRect(left, ey0, pw, ey1 - ey0);
      // label pill on right side
      const my = (ey0 + ey1) / 2;
      const textW = ctx.measureText(label).width;
      const px = left + pw - textW - 22;
      const py = my - 8;
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.strokeStyle = layerColors[li];
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(px, py, textW + 16, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = layerColors[li];
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 8, my + 3);
    }

    // --- OMZ marker lines ---
    ctx.strokeStyle = 'rgba(235,100,60,0.3)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 5]);
    [200, 1000].forEach((d) => {
      const y = yf(Math.min(d, maxDepth));
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + pw, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // --- grid ---
    ctx.strokeStyle = 'rgba(71,85,105,0.15)';
    ctx.lineWidth = 0.5;
    const nx = Math.min(distSet.length, 6);
    for (let i = 0; i < nx; i++) {
      const d = distSet[Math.round((i / (nx - 1 || 1)) * (distSet.length - 1))];
      const x = xf(d);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + ph);
      ctx.stroke();
    }

    // --- axes ---
    ctx.strokeStyle = '#5a677a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + ph);
    ctx.lineTo(left + pw, top + ph);
    ctx.stroke();

    // --- x ticks ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const tickY = top + ph + 6;
    const labelY = top + ph + 22;
    for (let i = 0; i < nx; i++) {
      const d = distSet[Math.round((i / (nx - 1 || 1)) * (distSet.length - 1))];
      const x = xf(d);
      ctx.beginPath();
      ctx.strokeStyle = '#5a677a';
      ctx.moveTo(x, top + ph);
      ctx.lineTo(x, tickY);
      ctx.stroke();
      ctx.fillText(`${Math.round(d)}`, x, labelY);
    }

    // --- x axis label ---
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.fillText('Distance (km)', left + pw / 2, top + ph + 38);

    // --- y ticks (nice spacing) ---
    ctx.textAlign = 'right';
    ctx.font = '10px sans-serif';
    const yNiceStep = maxDepth <= 200 ? 50 : maxDepth <= 1000 ? 200 : maxDepth <= 2000 ? 500 : 1000;
    let yTick = 0;
    while (yTick <= maxDepth) {
      const y = yf(yTick);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${yTick}`, left - 8, y + 4);
      ctx.strokeStyle = 'rgba(90,103,122,0.5)';
      ctx.beginPath();
      ctx.moveTo(left - 4, y);
      ctx.lineTo(left, y);
      ctx.stroke();
      yTick += yNiceStep;
    }

    // --- y axis label ---
    ctx.save();
    ctx.translate(14, top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Depth (m)', 0, 0);
    ctx.restore();

    // --- color bar ---
    const cbX = left + pw + COLORBAR_GAP;
    const cbW = COLORBAR_W;
    const cbY = top;
    const cbH = ph;

    for (let s = 0; s < cbH; s++) {
      const t = 1 - s / cbH;
      const [r, g, b] = interpColor(t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(cbX, cbY + s, cbW, 1);
    }
    ctx.strokeStyle = '#5a677a';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(cbX - 0.5, cbY - 0.5, cbW + 1, cbH + 1);

    // color bar labels
    const lblX = cbX + cbW + 8;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(maxO2)}`, lblX, cbY + 10);
    ctx.fillText(`${Math.round((minO2 + maxO2) / 2)}`, lblX, cbY + cbH / 2 + 4);
    ctx.fillText(`${Math.round(minO2)}`, lblX, cbY + cbH - 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.fillText('mmol/m³', lblX, cbY + cbH / 2 + 18);

    // --- hover tooltip ---
    if (hover) {
      const boxH = 56;
      const boxW = 152;
      const tx = Math.min(hover.x + 14, W - boxW - 4);
      const ty = Math.max(Math.min(hover.y - 30, H - boxH - 4), 4);
      ctx.fillStyle = 'rgba(15,23,42,0.94)';
      ctx.strokeStyle = 'rgba(56,189,248,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx - 6, ty - 4, boxW, boxH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Dist  ${hover.dist.toFixed(1)} km`, tx, ty + 12);
      ctx.fillText(`Depth ${hover.depth.toFixed(0)} m`, tx, ty + 28);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`DO    ${hover.o2.toFixed(1)} mmol/m³`, tx, ty + 44);
    }
  }, [sectionData, loading, error, resizeKey, hover]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const L = layoutRef.current;
    if (!canvas || !L || !L.grid) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx < L.left || mx > L.left + L.pw || my < L.top || my > L.top + L.ph) {
      setHover(null);
      return;
    }
    const dist = ((mx - L.left) / L.pw) * L.maxDist;
    const depth = ((my - L.top) / L.ph) * L.maxDepth;
    const val = bilinear(L.grid, L.depthSet, L.distSet, dist, depth);
    if (!isNaN(val)) {
      setHover({ x: mx, y: my, dist, depth, o2: val });
    } else {
      setHover(null);
    }
  };

  const handleMouseLeave = () => setHover(null);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
