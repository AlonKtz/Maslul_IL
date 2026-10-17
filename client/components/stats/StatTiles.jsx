import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

/*
  Six coloured tiles with the totals. The numbers count up from zero like a
  rev counter (straight to the end in a hidden tab or with reduce motion).
*/
const TILES = [
  ['members', '👥', 'tile-blue'], ['groups', '🏁', 'tile-green'], ['events', '📅', 'tile-red'],
  ['listings', '🏷️', 'tile-amber'], ['cars', '🏎️', 'tile-purple'], ['messages', '💬', 'tile-teal'],
];

function CountUp({ target }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.hidden || reduced) {
      setValue(target);
      return undefined;
    }
    let frame = 0;
    let start = null;
    const DURATION = 900;
    const step = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 0.5 - Math.cos(t * Math.PI) / 2;   // slow, fast, slow
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <strong className="stat-number">{value.toLocaleString('en-US')}</strong>;
}

export default function StatTiles({ refreshKey }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/api/stats/summary').then(setSummary).catch(() => setSummary({}));
  }, [refreshKey]);

  if (!summary) return <section className="stat-tiles"><p className="muted">Loading…</p></section>;

  return (
    <section className="stat-tiles">
      {TILES.map(([key, icon, colour]) => (
        <div key={key} className={'stat-tile ' + colour}>
          <span className="stat-icon" aria-hidden="true">{icon}</span>
          <CountUp target={Number(summary[key]) || 0} />
          <span className="stat-label">{key}</span>
        </div>
      ))}
    </section>
  );
}
