import React, { useState } from 'react';
import { toast } from '../../lib/toast';

/*
  The big search over every garage: make, model, body type, colour, a year
  range and a horsepower range. Empty fields are left out of the search.
  onSearch gets the filled in fields, onClear empties them again.
*/
const EMPTY = { make: '', model: '', category: '', color: '', yearFrom: '', yearTo: '', hpMin: '', hpMax: '' };

export default function CarSearch({ categories, onSearch, onClear }) {
  const [f, setF] = useState(EMPTY);
  const set = (field) => (e) => setF({ ...f, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    // make sure the ranges make sense before sending them
    if (f.yearFrom && f.yearTo && Number(f.yearFrom) > Number(f.yearTo)) {
      return toast('The "year from" cannot be later than the "year to".', true);
    }
    if (f.hpMin && f.hpMax && Number(f.hpMin) > Number(f.hpMax)) {
      return toast('The minimum horsepower cannot be above the maximum.', true);
    }
    const params = {};
    Object.keys(f).forEach((k) => {
      if (f[k].trim() !== '') params[k] = f[k].trim();
    });
    onSearch(params);
  }

  function clear() {
    setF(EMPTY);
    onClear();
  }

  return (
    <section className="search-panel" style={{ marginTop: '1.25rem' }}>
      <h2 className="small" style={{ marginTop: 0 }}>Search every garage</h2>
      <form onSubmit={submit} noValidate>
        <div className="filter-row">
          <div>
            <label htmlFor="s-make">Make</label>
            <input id="s-make" type="text" placeholder="BMW" value={f.make} onChange={set('make')} />
          </div>
          <div>
            <label htmlFor="s-model">Model</label>
            <input id="s-model" type="text" placeholder="M3" value={f.model} onChange={set('model')} />
          </div>
          <div>
            <label htmlFor="s-category">Body type</label>
            <select id="s-category" value={f.category} onChange={set('category')}>
              <option value="">Any</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="s-color">Colour</label>
            <input id="s-color" type="text" placeholder="blue" value={f.color} onChange={set('color')} />
          </div>
          <div>
            <label htmlFor="s-yfrom">Year from</label>
            <input id="s-yfrom" type="number" min="1900" max="2027" placeholder="1990"
                   value={f.yearFrom} onChange={set('yearFrom')} />
          </div>
          <div>
            <label htmlFor="s-yto">Year to</label>
            <input id="s-yto" type="number" min="1900" max="2027" placeholder="2005"
                   value={f.yearTo} onChange={set('yearTo')} />
          </div>
          <div>
            <label htmlFor="s-hpmin">HP from</label>
            <input id="s-hpmin" type="number" min="0" max="2000" placeholder="200"
                   value={f.hpMin} onChange={set('hpMin')} />
          </div>
          <div>
            <label htmlFor="s-hpmax">HP to</label>
            <input id="s-hpmax" type="number" min="0" max="2000" placeholder="600"
                   value={f.hpMax} onChange={set('hpMax')} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">Search</button>
          <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
        </div>
      </form>
    </section>
  );
}
