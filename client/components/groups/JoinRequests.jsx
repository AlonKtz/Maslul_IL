import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  The manager's queue for a private group: people who asked to join, each
  with Approve and Reject. Approving reloads the page so the new member
  shows in the member list.
*/
export default function JoinRequests({ groupId, pending }) {
  const [people, setPeople] = useState(pending || []);

  async function answer(person, approve) {
    try {
      await api.post('/api/groups/' + groupId + (approve ? '/approve' : '/reject'), { userId: person._id });
      toast(approve ? 'Member approved' : 'Request rejected');
      setPeople((list) => list.filter((p) => p._id !== person._id));
      if (approve) window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <section className="card">
      <h2>Join requests <span className="muted small">(manager only)</span></h2>
      <div className="people">
        {people.map((p) => (
          <span className="person" key={p._id}>
            <img src={p.avatar} alt="" />
            <span>{p.displayName || p.username}</span>
            <button className="btn btn-ghost small" type="button" onClick={() => answer(p, true)}>Approve</button>
            <button className="btn btn-ghost small" type="button" onClick={() => answer(p, false)}>Reject</button>
          </span>
        ))}
      </div>
      {!people.length && <p className="muted small">No requests waiting.</p>}
    </section>
  );
}
