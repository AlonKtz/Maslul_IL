import React, { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import FormError from '../common/FormError';

/*
  Sell something, or edit a listing when `listing` is given. Up to six
  photos are uploaded first (POST /api/upload/many) and saved with it.
  Make, model and year are only for whole cars, so they are optional.
*/
const EMPTY = {
  title: '', price: '', category: '', condition: '', city: '',
  make: '', model: '', year: '', description: '',
};

export default function ListingForm({ listing, categories, conditions, cities, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setError('');
    if (listing) {
      setForm({
        title: listing.title,
        price: String(listing.price),
        category: listing.category,
        condition: listing.condition,
        city: listing.city,
        make: listing.make || '',
        model: listing.model || '',
        year: listing.year ? String(listing.year) : '',
        description: listing.description || '',
      });
      if (boxRef.current) boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm({ ...EMPTY, condition: conditions[0] });
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [listing, conditions]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const price = Number(form.price);
    if (form.title.trim().length < 3) return setError('Give the item a title of at least 3 characters.');
    if (form.price === '' || isNaN(price) || price < 0) return setError('Enter a price of zero or more.');
    if (!form.category) return setError('Choose a category.');
    if (!form.city) return setError('Choose the city the item is in.');
    if (form.year && (Number(form.year) < 1900 || Number(form.year) > 2027)) return setError('Enter a realistic year.');

    const payload = { ...form, title: form.title.trim(), price };
    if (form.year) payload.year = Number(form.year);
    else delete payload.year;

    setBusy(true);
    try {
      const files = fileRef.current ? fileRef.current.files : [];
      if (files.length) payload.photos = (await api.uploadImages(files)).urls;
      if (listing) await api.put('/api/listings/' + listing._id, payload);
      else await api.post('/api/listings', payload);
      toast(listing ? 'Listing updated' : 'Listing published');
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" ref={boxRef}>
      <h2>List an item</h2>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div>
            <label htmlFor="li-title">Title</label>
            <input id="li-title" type="text" maxLength="80" required placeholder={'BBS RS 17" set of four'}
                   value={form.title} onChange={set('title')} />
          </div>
          <div>
            <label htmlFor="li-price">Price (₪)</label>
            <input id="li-price" type="number" min="0" step="1" required placeholder="3200"
                   value={form.price} onChange={set('price')} />
          </div>
          <div>
            <label htmlFor="li-category">Category</label>
            <select id="li-category" value={form.category} onChange={set('category')}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="li-condition">Condition</label>
            <select id="li-condition" value={form.condition} onChange={set('condition')}>
              {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="li-city">City</label>
            <select id="li-city" value={form.city} onChange={set('city')}>
              <option value="">Choose a city…</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="li-photos">Photos <span className="hint">(up to 6)</span></label>
            <input id="li-photos" type="file" accept="image/*" multiple ref={fileRef} />
          </div>
        </div>

        <p className="hint" style={{ marginTop: '1rem' }}>Selling a whole car? Fill these in too.</p>
        <div className="form-grid">
          <div>
            <label htmlFor="li-make">Make</label>
            <input id="li-make" type="text" maxLength="40" placeholder="Mazda" value={form.make} onChange={set('make')} />
          </div>
          <div>
            <label htmlFor="li-model">Model</label>
            <input id="li-model" type="text" maxLength="40" placeholder="MX-5" value={form.model} onChange={set('model')} />
          </div>
          <div>
            <label htmlFor="li-year">Year</label>
            <input id="li-year" type="number" min="1900" max="2027" placeholder="1994" value={form.year} onChange={set('year')} />
          </div>
        </div>

        <label htmlFor="li-desc">Description</label>
        <textarea id="li-desc" rows="3" maxLength="1000" placeholder="Condition, history, what is included…"
                  value={form.description} onChange={set('description')} />

        <FormError message={error} />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : listing ? 'Save changes' : 'Publish listing'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
