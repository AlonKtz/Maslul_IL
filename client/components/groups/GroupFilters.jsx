import React, { useState } from 'react';

/*
  Finding a group: a word in the name, the category, the brand, public or
  private, and a minimum number of members.
*/
const EMPTY = { name: '', category: '', brand: '', privacy: '', minMembers: '' };

export default function GroupFilters({ categories, onSearch, onClear, title = 'Find a group', buttonText = 'Search' }) {
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
      <h2 className="small" style={{ marginTop: 0 }}>{title}</h2>
      <form onSubmit={submit} noValidate>
        <div className="filter-row">
          <div>
            <label htmlFor="f-name">Name</label>
            <input id="f-name" type="text" placeholder="JDM" value={f.name} onChange={set('name')} />
          </div>
          <div>
            <label htmlFor="f-category">Category</label>
            <select id="f-category" value={f.category} onChange={set('category')}>
              <option value="">Any</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-brand">Brand</label>
            <input id="f-brand" type="text" placeholder="Toyota" value={f.brand} onChange={set('brand')} />
          </div>
          <div>
            <label htmlFor="f-privacy">Privacy</label>
            <select id="f-privacy" value={f.privacy} onChange={set('privacy')}>
              <option value="">Any</option>
              <option value="public">Public only</option>
              <option value="private">Private only</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-members">Min members</label>
            <input id="f-members" type="number" min="1" placeholder="5" value={f.minMembers} onChange={set('minMembers')} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">{buttonText}</button>
          <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
        </div>
      </form>
    </section>
  );
}
