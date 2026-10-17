import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

/*
  Finding members: part of the name, the town, a word in the bio, and the
  make of a car they own. Results show as cards linking to the profile.
*/
const EMPTY = { username: '', location: '', keyword: '', carMake: '' };

export default function MemberSearch() {
  const [f, setF] = useState(EMPTY);
  const [users, setUsers] = useState(undefined);
  const set = (field) => (e) => setF({ ...f, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const params = {};
    Object.keys(f).forEach((k) => {
      if (f[k].trim() !== '') params[k] = f[k].trim();
    });
    setUsers(null);
    try {
      const res = await api.get('/api/users/search', params);
      setUsers(res.users);
      toast(res.total + ' member' + (res.total === 1 ? '' : 's') + ' found');
    } catch (err) {
      setUsers(undefined);
      toast(errorText(err), true);
    }
  }

  function clear() {
    setF(EMPTY);
    setUsers(undefined);
  }

  let results = null;
  if (users === null) results = <Loading text="Searching…" />;
  else if (users && !users.length) results = <Empty>No member matched those filters.</Empty>;
  else if (users) {
    results = users.map((u) => (
      <article className="item-card" key={u._id}>
        <div className="item-body" style={{ alignItems: 'center', textAlign: 'center' }}>
          <img src={u.avatar} alt=""
               style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} />
          <h3 className="item-title" style={{ marginTop: '.5rem' }}>
            <a href={'/profile/' + u.username}>{u.displayName || u.username}</a>
          </h3>
          <p className="item-meta">{'@' + u.username + (u.location ? ' · ' + u.location : '')}</p>
          {u.bio && <p className="item-meta">{u.bio}</p>}
          <p className="item-meta">{(u.friends || []).length + ' friends'}</p>
        </div>
      </article>
    ));
  }

  return (
    <>
      <section className="search-panel" style={{ marginTop: '1.25rem' }}>
        <h2 className="small" style={{ marginTop: 0 }}>Find members</h2>
        <form onSubmit={submit} noValidate>
          <div className="filter-row">
            <div>
              <label htmlFor="m-username">Name or username</label>
              <input id="m-username" type="text" placeholder="alon" value={f.username} onChange={set('username')} />
            </div>
            <div>
              <label htmlFor="m-location">Location</label>
              <input id="m-location" type="text" placeholder="Haifa" value={f.location} onChange={set('location')} />
            </div>
            <div>
              <label htmlFor="m-keyword">Bio contains</label>
              <input id="m-keyword" type="text" placeholder="turbo" value={f.keyword} onChange={set('keyword')} />
            </div>
            <div>
              <label htmlFor="m-carmake">Owns a car by</label>
              <input id="m-carmake" type="text" placeholder="Toyota" value={f.carMake} onChange={set('carMake')} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Search members</button>
            <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
          </div>
        </form>
      </section>
      <div className="grid">{results}</div>
    </>
  );
}
