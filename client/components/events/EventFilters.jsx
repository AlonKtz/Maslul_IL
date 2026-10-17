import React, { useState } from 'react';

/*
  Searching the meets and races: a word in the title or description, meet
  or race, the race format, the city and a date range. Past events are left
  out unless the box is ticked. onSearch gets the filled in fields.
*/
const EMPTY = { keyword: '', type: '', raceType: '', city: '', dateFrom: '', dateTo: '', includePast: false };

export default function EventFilters({ cities, raceTypes, onSearch, onClear }) {
  const [f, setF] = useState(EMPTY);
  const set = (field) => (e) => setF({ ...f, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const params = {};
    Object.keys(f).forEach((k) => {
      if (k === 'includePast') {
        if (f.includePast) params.includePast = 'true';
      } else if (String(f[k]).trim() !== '') {
        params[k] = String(f[k]).trim();
      }
    });
    onSearch(params);
  }

  function clear() {
    setF(EMPTY);
    onClear();
  }

  return (
    <section className="search-panel">
      <h2 className="small" style={{ marginTop: 0 }}>Filter events</h2>
      <form onSubmit={submit} noValidate>
        <div className="filter-row">
          <div>
            <label htmlFor="f-keyword">Keyword</label>
            <input id="f-keyword" type="text" placeholder="title or description" value={f.keyword} onChange={set('keyword')} />
          </div>
          <div>
            <label htmlFor="f-type">Type</label>
            <select id="f-type" value={f.type} onChange={set('type')}>
              <option value="">Any</option>
              <option value="meet">Meets</option>
              <option value="race">Races</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-racetype">Race format</label>
            <select id="f-racetype" value={f.raceType} onChange={set('raceType')}>
              <option value="">Any</option>
              {raceTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-city">City</label>
            <select id="f-city" value={f.city} onChange={set('city')}>
              <option value="">Anywhere</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-from">From</label>
            <input id="f-from" type="date" value={f.dateFrom} onChange={set('dateFrom')} />
          </div>
          <div>
            <label htmlFor="f-to">To</label>
            <input id="f-to" type="date" value={f.dateTo} onChange={set('dateTo')} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">Search</button>
          <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
          <label className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', margin: 0 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={f.includePast}
                   onChange={(e) => setF({ ...f, includePast: e.target.checked })} />
            include past events
          </label>
        </div>
      </form>
    </section>
  );
}
