import React, { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import { formatDate } from '../../lib/format';
import { isMine } from '../../lib/session';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

/*
  Finding members as an admin (name, town, role) and making them admins or
  ordinary members again. An admin cannot change their own role.
  onChanged tells the page so the counts refresh.
*/
const EMPTY = { username: '', location: '', role: '' };

export default function AdminMembers({ onChanged }) {
  const [f, setF] = useState(EMPTY);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const set = (field) => (e) => setF({ ...f, [field]: e.target.value });

  const load = useCallback((filters) => {
    const params = {};
    Object.keys(filters).forEach((k) => {
      if (filters[k].trim() !== '') params[k] = filters[k].trim();
    });
    setUsers(null);
    api.get('/api/admin/members', params)
      .then((res) => { setUsers(res.users); setError(''); })
      .catch((err) => setError(errorText(err)));
  }, []);

  useEffect(() => { load(EMPTY); }, [load]);

  function submit(e) {
    e.preventDefault();
    load(f);
  }

  function clear() {
    setF(EMPTY);
    load(EMPTY);
  }

  async function changeRole(u) {
    const role = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm('Change this member\'s role to "' + role + '"?')) return;
    try {
      await api.post('/api/admin/members/' + u._id + '/role', { role });
      toast('Role updated');
      load(f);
      onChanged();
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  let list;
  if (error) list = <Empty>{error}</Empty>;
  else if (!users) list = <Loading />;
  else if (!users.length) list = <Empty>No member matched.</Empty>;
  else {
    list = users.map((u) => (
      <div className="comment" key={u._id}>
        <img src={u.avatar} alt="" />
        <div className="comment-body">
          <div className="comment-author">
            <a href={'/profile/' + u.username}>{u.displayName || u.username}</a>{' '}
            <span className="badge">{u.role}</span>
          </div>
          <div className="muted small">
            {'@' + u.username + (u.location ? ' · ' + u.location : '') + ' · joined ' + formatDate(u.createdAt)}
          </div>
        </div>
        {isMine(u._id) ? (
          <span className="muted small">that is you</span>
        ) : (
          <button className="btn btn-ghost small" type="button" onClick={() => changeRole(u)}>
            {u.role === 'admin' ? 'Make member' : 'Make admin'}
          </button>
        )}
      </div>
    ));
  }

  return (
    <>
      <section className="search-panel" style={{ marginTop: '1.25rem' }}>
        <h2 className="small" style={{ marginTop: 0 }}>Find a member</h2>
        <form onSubmit={submit} noValidate>
          <div className="filter-row">
            <div>
              <label htmlFor="a-username">Name or username</label>
              <input id="a-username" type="text" placeholder="noa" value={f.username} onChange={set('username')} />
            </div>
            <div>
              <label htmlFor="a-location">Location</label>
              <input id="a-location" type="text" placeholder="Haifa" value={f.location} onChange={set('location')} />
            </div>
            <div>
              <label htmlFor="a-role">Role</label>
              <select id="a-role" value={f.role} onChange={set('role')}>
                <option value="">Any</option>
                <option value="user">Members</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Search</button>
            <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
          </div>
        </form>
      </section>
      <div>{list}</div>
    </>
  );
}
