import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// a few members I am not friends with yet and have not asked
export default function PeopleYouMayKnow() {
  const [people, setPeople] = useState(null);

  useEffect(() => {
    api.get('/api/feed/suggestions').then((res) => setPeople(res.suggestions)).catch(() => setPeople([]));
  }, []);

  return (
    <section className="card">
      <h2 className="small">People you might know</h2>
      <div className="people">
        {people && people.length === 0 && <p className="muted small">Nobody new to suggest.</p>}
        {people && people.map((u) => (
          <a key={u._id} className="person" href={'/profile/' + u.username}>
            <img src={u.avatar} alt="" />
            <span>{u.displayName || u.username}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
