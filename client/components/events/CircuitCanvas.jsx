import React, { useEffect, useRef } from 'react';

/*
  A race's track, drawn on a canvas with a little car going round it.

  layout is a list of [x, y] points between 0 and 1 (src/data/circuits.jsx),
  scaled here to fit the canvas. closed means the last point joins back to
  the first, a lap; otherwise it is point to point, like a drag strip.
*/
const W = 560;
const H = 320;
const PAD = 34;

export default function CircuitCanvas({ layout, closed }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    const pts = layout.map((p) => [PAD + p[0] * (W - PAD * 2), PAD + p[1] * (H - PAD * 2)]);
    if (closed) pts.push(pts[0]);

    // how long each piece is, so the car can be placed any fraction of the way round
    const segLen = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segLen.push(d);
      total += d;
    }

    function pointAt(fraction) {
      let dist = fraction * total;
      let i = 0;
      while (i < segLen.length - 1 && dist > segLen[i]) { dist -= segLen[i]; i++; }
      const t = segLen[i] ? dist / segLen[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }

    function drawTrack() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1216';
      ctx.fillRect(0, 0, W, H);

      // the tarmac: a thick line with round joins so corners look like corners
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.strokeStyle = '#2b343d';
      ctx.lineWidth = 18;
      ctx.stroke();

      // the centre line
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = '#4a5663';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // start and finish
      const s = pts[0];
      const e = pts[pts.length - 1];
      ctx.fillStyle = '#e8edf2';
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      ctx.fillText('START', s[0] + 12, s[1] - 12);
      if (!closed) ctx.fillText('FINISH', e[0] - 44, e[1] - 12);
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath(); ctx.arc(s[0], s[1], 5, 0, 7); ctx.fill();
      if (!closed) {
        ctx.fillStyle = '#e63946';
        ctx.beginPath(); ctx.arc(e[0], e[1], 5, 0, 7); ctx.fill();
      }
    }

    // the car is a red dot with a glow, moved every frame. the browser pauses
    // this in a hidden tab, so the plain track is always drawn first
    let start = null;
    let frameId = 0;
    const LAP_MS = closed ? 6000 : 4000;
    function frame(now) {
      if (!start) start = now;
      drawTrack();
      const p = pointAt(((now - start) % LAP_MS) / LAP_MS);
      ctx.shadowColor = '#e63946';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#e63946';
      ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      frameId = window.requestAnimationFrame(frame);
    }

    drawTrack();
    frameId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(frameId);
  }, [layout, closed]);

  return <canvas ref={canvasRef} className="circuit-canvas" width={W} height={H} />;
}
