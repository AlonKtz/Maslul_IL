import React, { useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import FormError from '../common/FormError';

/*
  Start a group, or edit one when `group` is given (the manager's settings
  on the group page). A private group needs the manager's approval to join.
  onSaved gets the saved group.
*/
const EMPTY = { name: '', category: '', brand: '', description: '', isPrivate: false };

export default function GroupForm({ group, categories, title = 'Start a group', onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError('');
    setForm(group ? {
      name: group.name,
      category: group.category,
      brand: group.brand || '',
      description: group.description || '',
      isPrivate: Boolean(group.isPrivate),
    } : { ...EMPTY, category: categories[0] });
  }, [group, categories]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      return setError(group ? 'The group needs a name of at least 2 characters.' : 'Give the group a name of at least 2 characters.');
    }
    const payload = { ...form, name: form.name.trim() };
    setBusy(true);
    try {
      const res = group ? await api.put('/api/groups/' + group._id, payload) : await api.post('/api/groups', payload);
      toast(group ? 'Group updated' : 'Group created');
      onSaved(res.group);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>{title}</h2>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div>
            <label htmlFor="g-name">Name</label>
            <input id="g-name" type="text" maxLength="50" required placeholder="JDM Israel"
                   value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label htmlFor="g-category">Category</label>
            <select id="g-category" value={form.category} onChange={set('category')}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="g-brand">Brand <span className="hint">(optional)</span></label>
            <input id="g-brand" type="text" maxLength="40" placeholder="Toyota" value={form.brand} onChange={set('brand')} />
          </div>
          <div>
            <label htmlFor="g-private" style={{ marginTop: '2rem' }}>
              <input id="g-private" type="checkbox" style={{ width: 'auto' }} checked={form.isPrivate}
                     onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
              {' '}Private group <span className="hint">(joining needs approval)</span>
            </label>
          </div>
        </div>

        <label htmlFor="g-desc">Description</label>
        <textarea id="g-desc" rows="3" maxLength="500" placeholder="Who is this group for?"
                  value={form.description} onChange={set('description')} />

        <FormError message={error} />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? (group ? 'Saving…' : 'Creating…') : (group ? 'Save changes' : 'Create group')}
          </button>
          {onCancel && <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}
