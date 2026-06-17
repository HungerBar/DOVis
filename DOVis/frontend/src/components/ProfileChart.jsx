import { useRef, useEffect, useState } from 'react';

const LAYERS = [
  [0, 200, 'Mixed Layer', '#38bdf8'],
  [200, 1000, 'Thermocline / OMZ', '#fbbf24'],
  [1000, 99999, 'Deep Water', '#818cf8'],
];

const LOADING_COLOR = '#c4b5fd';

export default function ProfileChart({ profileData, loading, error }) {
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

    if (loading || error || !profileData?.profile?.length) {
      ctx.fillStyle = loading ? LOADING_COLOR : error ? '#f87171' : '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        loading ? 'Loading...' : error ? `Error: ${error}` : 'Click on the globe to select a point',
        W / 2, H / 2
      );
      return;
    }

    let { profile, location } = profileData;
    profile = profile.filter((p) => p.oxygen != null && !isNaN(p.oxygen));
    if (!profile.length) return;
    const depths = profile.map((p) => p.depth);
    const oxygens = profile.map((p) => p.oxygen);
    const minO2 = Math.min(...oxygens);
    let maxO2 = Math.max(...oxygens);
    const o2Pad = (maxO2 - minO2) * 0.08 || 8;
    maxO2 += o2Pad;
    const o2Range = maxO2 - minO2;
    const maxDepth = Math.max(...depths);

    // Layout — DO on X, Depth on Y (0 top, increasing down)
    const left = 70;
    const right = 20;
    const top = 56;
    const bottom = 48;
    const pw = W - left - right;
    const ph = H - top - bottom;
    if (pw <= 0 || ph <= 0) return;

    const xf = (v) => left + ((v - minO2) / o2Range) * pw;
    const yf = (d) => top + (d / maxDepth) * ph;

    layoutRef.current = { left, right, top, bottom, pw, ph, minO2, o2Range, maxDepth, profile };

    // --- Layer backgrounds ---
    for (let li = 0; li < LAYERS.length; li++) {
      const [ly0, ly1] = LAYERS[li];
      const ey0 = yf(ly0);
      const ey1 = yf(Math.min(ly1, maxDepth));
      if (ey1 <= ey0) continue;
      ctx.fillStyle = 'rgba(148,163,184,0.03)';
      ctx.fillRect(left, ey0, pw, ey1 - ey0);
    }

    // --- Grid ---
    ctx.strokeStyle = 'rgba(71,85,105,0.15)';
    ctx.lineWidth = 0.5;
    const o2Nice = o2Range > 150 ? 50 : o2Range > 80 ? 25 : o2Range > 40 ? 10 : 5;
    let gv = Math.ceil(minO2 / o2Nice) * o2Nice;
    while (gv <= maxO2) {
      const x = xf(gv);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + ph);
      ctx.stroke();
      gv += o2Nice;
    }
    const dNice = maxDepth <= 200 ? 50 : maxDepth <= 1000 ? 200 : maxDepth <= 2000 ? 500 : 1000;
    let gd = 0;
    while (gd <= maxDepth) {
      const y = yf(gd);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + pw, y);
      ctx.stroke();
      gd += dNice;
    }

    // --- Gradient fill under curve ---
    const grad = ctx.createLinearGradient(0, top, 0, top + ph);
    grad.addColorStop(0, 'rgba(56,189,248,0.25)');
    grad.addColorStop(0.5, 'rgba(56,189,248,0.06)');
    grad.addColorStop(1, 'rgba(56,189,248,0.01)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < profile.length; i++) {
      const px = xf(profile[i].oxygen);
      const py = yf(profile[i].depth);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    // close to bottom-right then bottom-left
    ctx.lineTo(xf(profile[profile.length - 1].oxygen), top + ph);
    ctx.lineTo(xf(profile[0].oxygen), top + ph);
    ctx.closePath();
    ctx.fill();

    // --- Profile line ---
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < profile.length; i++) {
      const px = xf(profile[i].oxygen);
      const py = yf(profile[i].depth);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // --- Data points ---
    for (const p of profile) {
      const px = xf(p.oxygen);
      const py = yf(p.depth);
      // outer glow
      ctx.fillStyle = 'rgba(56,189,248,0.3)';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      // inner dot
      ctx.fillStyle = '#0b1220';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Axes ---
    ctx.strokeStyle = '#5a677a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + ph);
    ctx.lineTo(left + pw, top + ph);
    ctx.stroke();

    // --- X ticks & labels (DO) ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    gv = Math.ceil(minO2 / o2Nice) * o2Nice;
    while (gv <= maxO2) {
      const x = xf(gv);
      ctx.strokeStyle = '#5a677a';
      ctx.beginPath();
      ctx.moveTo(x, top + ph);
      ctx.lineTo(x, top + ph + 5);
      ctx.stroke();
      ctx.fillText(`${Math.round(gv)}`, x, top + ph + 18);
      gv += o2Nice;
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.fillText('Dissolved Oxygen (mmol/m³)', left + pw / 2, top + ph + 34);

    // --- Y ticks & labels (Depth) ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    gd = 0;
    while (gd <= maxDepth) {
      const y = yf(gd);
      ctx.strokeStyle = 'rgba(90,103,122,0.5)';
      ctx.beginPath();
      ctx.moveTo(left - 4, y);
      ctx.lineTo(left, y);
      ctx.stroke();
      ctx.fillText(`${gd}`, left - 8, y + 4);
      gd += dNice;
    }
    ctx.save();
    ctx.translate(14, top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Depth (m)', 0, 0);
    ctx.restore();

    // --- Layer pill labels ---
    for (let li = 0; li < LAYERS.length; li++) {
      const [ly0, ly1, label, color] = LAYERS[li];
      const ey0 = yf(ly0);
      const ey1 = yf(Math.min(ly1, maxDepth));
      if (ey1 <= ey0 || ey1 - ey0 < 20) continue;
      const my = (ey0 + ey1) / 2;
      ctx.font = 'bold 10px sans-serif';
      const tw = ctx.measureText(label).width;
      const px = left + pw - tw - 22;
      const py = my - 8;
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(px, py, tw + 16, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 8, my + 3);
    }

    // --- Location title ---
    if (location) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${location.lat.toFixed(2)}°N  ${location.lon.toFixed(2)}°E`,
        left, 18
      );
    }

    // --- Hover tooltip ---
    if (hover) {
      const boxH = 44;
      const boxW = 148;
      const tx = Math.min(hover.x + 14, W - boxW - 4);
      const ty = Math.max(Math.min(hover.y - 24, H - boxH - 4), 4);
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
      ctx.fillText(`Depth  ${hover.depth.toFixed(0)} m`, tx, ty + 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`DO     ${hover.o2.toFixed(1)} mmol/m³`, tx, ty + 30);
    }
  }, [profileData, loading, error, resizeKey, hover]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const L = layoutRef.current;
    if (!canvas || !L.profile) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx < L.left || mx > L.left + L.pw || my < L.top || my > L.top + L.ph) {
      setHover(null);
      return;
    }
    const o2 = L.minO2 + ((mx - L.left) / L.pw) * L.o2Range;
    const depth = ((my - L.top) / L.ph) * L.maxDepth;
    // Snap to nearest data point
    let best = null;
    let bestDist = Infinity;
    for (const p of L.profile) {
      const d = Math.abs(o2 - p.oxygen) + Math.abs(depth - p.depth) * 0.1;
      if (d < bestDist) { bestDist = d; best = p; }
    }
    if (best) {
      setHover({ x: mx, y: my, depth: best.depth, o2: best.oxygen });
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
