import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

/*
  The counts at the top of the admin page (members, events, listings...).
  refreshKey changes whenever something on the page was changed, so the
  numbers are fetched again.
*/
export default function AdminOverview({ refreshKey }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    api.get('/api/admin/overview').then((res) => setCounts(res.counts)).catch(() => setCounts({}));
  }, [refreshKey]);

  return (
    <section className="card">
      <div className="filter-row" style={{ textAlign: 'center' }}>
        {!counts && <p className="muted">Loading…</p>}
        {counts && Object.keys(counts).map((key) => (
          <div key={key}>
            <strong style={{ fontSize: '1.6rem' }} className="glow">{counts[key]}</strong><br />
            <span className="muted small">{key}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
