import React from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  People who asked to be my friend, shown on my own profile, each with an
  Accept button. The page reloads after accepting so the friend list
  updates. requests are passed in by the server with names and pictures.
*/
export default function FriendRequests({ requests }) {
  async function accept(person) {
    try {
      await api.post('/api/users/' + person._id + '/accept');
      toast('Friend added');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <section className="card">
      <h2 className="small">Friend requests</h2>
      <div className="people">
        {requests.map((u) => (
          <span className="person" key={u._id}>
            <img src={u.avatar} alt="" />
            <span>{u.displayName || u.username}</span>
            <button className="btn btn-ghost small" type="button" onClick={() => accept(u)}>Accept</button>
          </span>
        ))}
      </div>
      {!requests.length && <p className="muted small">No requests.</p>}
    </section>
  );
}
