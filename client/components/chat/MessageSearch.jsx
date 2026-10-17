import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import { formatDateTime } from '../../lib/format';
import { isMine } from '../../lib/session';

/*
  Searching my own messages: a word, who with, and a date range. Only
  conversations I am part of are searched (the server makes sure of that).
*/
const EMPTY = { keyword: '', withUser: '', dateFrom: '', dateTo: '' };

export default function MessageSearch({ friends }) {
  const [f, setF] = useState(EMPTY);
  const [results, setResults] = useState(undefined);
  const set = (field) => (e) => setF({ ...f, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const params = {};
    Object.keys(f).forEach((k) => {
      if (f[k].trim() !== '') params[k] = f[k].trim();
    });
    setResults(null);
    try {
      const res = await api.get('/api/messages/search', params);
      setResults(res.messages);
      toast(res.total + ' message' + (res.total === 1 ? '' : 's') + ' found');
    } catch (err) {
      setResults(undefined);
      toast(errorText(err), true);
    }
  }

  function clear() {
    setF(EMPTY);
    setResults(undefined);
  }

  let list = null;
  if (results === null) list = <p className="loading">Searching…</p>;
  else if (results && !results.length) list = <p className="empty">Nothing matched.</p>;
  else if (results) {
    list = (
      <div className="search-results">
        {results.map((m) => (
          <div className="comment" key={m._id}>
            <div className="comment-body">
              <div className="comment-author">
                {isMine(m.from._id)
                  ? 'You → ' + (m.to.displayName || m.to.username)
                  : (m.from.displayName || m.from.username) + ' → you'}{' '}
                <span className="muted small">{formatDateTime(m.createdAt)}</span>
              </div>
              <div>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="search-panel" style={{ marginTop: '1.5rem' }}>
      <h2 className="small" style={{ marginTop: 0 }}>Search your messages</h2>
      <form onSubmit={submit} noValidate>
        <div className="filter-row">
          <div>
            <label htmlFor="ms-keyword">Contains</label>
            <input id="ms-keyword" type="text" placeholder="wheels" value={f.keyword} onChange={set('keyword')} />
          </div>
          <div>
            <label htmlFor="ms-with">With</label>
            <select id="ms-with" value={f.withUser} onChange={set('withUser')}>
              <option value="">Anyone</option>
              {friends.map((fr) => <option key={fr._id} value={fr._id}>{fr.displayName || fr.username}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ms-from">From</label>
            <input id="ms-from" type="date" value={f.dateFrom} onChange={set('dateFrom')} />
          </div>
          <div>
            <label htmlFor="ms-to">To</label>
            <input id="ms-to" type="date" value={f.dateTo} onChange={set('dateTo')} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">Search messages</button>
          <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
        </div>
      </form>
      {list}
    </section>
  );
}
