import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// "Your groups" next to the feed: links to the groups I belong to
export default function MyGroups() {
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    api.get('/api/feed/suggestions').then((res) => setGroups(res.groups)).catch(() => setGroups([]));
  }, []);

  return (
    <section className="card" style={{ marginTop: 0 }}>
      <h2 className="small">Your groups</h2>
      <div className="people">
        {groups && groups.length === 0 && <p className="muted small">You have not joined a group yet.</p>}
        {groups && groups.map((g) => (
          <a key={g._id} className="person" href={'/groups/' + g._id}><span>{g.name}</span></a>
        ))}
      </div>
    </section>
  );
}
