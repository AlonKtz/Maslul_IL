import React, { useState } from 'react';

/*
  Searching the market: a word, category, condition, city, a price range,
  the make, and the order. Empty fields are left out of the search.
*/
const EMPTY = { keyword: '', category: '', condition: '', city: '', priceMin: '', priceMax: '', make: '', sort: '' };

export default function MarketFilters({ categories, conditions, cities, onSearch, onClear }) {
  const [f, setF] = useState(EMPTY);
  const set = (field) => (e) => setF({ ...f, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
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
    <section className="search-panel">
      <h2 className="small" style={{ marginTop: 0 }}>Filter the market</h2>
      <form onSubmit={submit} noValidate>
        <div className="filter-row">
          <div>
            <label htmlFor="f-keyword">Keyword</label>
            <input id="f-keyword" type="text" placeholder="wheels, turbo…" value={f.keyword} onChange={set('keyword')} />
          </div>
          <div>
            <label htmlFor="f-category">Category</label>
            <select id="f-category" value={f.category} onChange={set('category')}>
              <option value="">Any</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-condition">Condition</label>
            <select id="f-condition" value={f.condition} onChange={set('condition')}>
              <option value="">Any</option>
              {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
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
            <label htmlFor="f-pmin">Min price</label>
            <input id="f-pmin" type="number" min="0" placeholder="0" value={f.priceMin} onChange={set('priceMin')} />
          </div>
          <div>
            <label htmlFor="f-pmax">Max price</label>
            <input id="f-pmax" type="number" min="0" placeholder="50000" value={f.priceMax} onChange={set('priceMax')} />
          </div>
          <div>
            <label htmlFor="f-make">Make</label>
            <input id="f-make" type="text" placeholder="Mazda" value={f.make} onChange={set('make')} />
          </div>
          <div>
            <label htmlFor="f-sort">Sort by</label>
            <select id="f-sort" value={f.sort} onChange={set('sort')}>
              <option value="">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
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
