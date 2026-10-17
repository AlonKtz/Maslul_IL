import React, { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import FormError from '../common/FormError';

/*
  Add a car, or edit one when `car` is given. The photo is uploaded first
  (POST /api/upload) and its address saved with the car. The same rules as
  the server, so mistakes are caught before anything is sent.
*/
const EMPTY = { make: '', model: '', year: '', category: '', engine: '', horsepower: '', color: '', description: '' };

export default function CarForm({ car, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const boxRef = useRef(null);

  // editing fills the form with the car, adding starts empty
  useEffect(() => {
    setError('');
    if (car) {
      setForm({
        make: car.make,
        model: car.model,
        year: String(car.year),
        category: car.category || categories[0],
        engine: car.engine || '',
        horsepower: car.horsepower ? String(car.horsepower) : '',
        color: car.color || '',
        description: car.description || '',
      });
      if (boxRef.current) boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm({ ...EMPTY, category: categories[0] });
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [car, categories]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.make.trim()) return setError('Enter the make.');
    if (!form.model.trim()) return setError('Enter the model.');
    const year = Number(form.year);
    if (!form.year || isNaN(year) || year < 1900 || year > 2027) return setError('Enter a realistic year.');
    const hp = form.horsepower === '' ? 0 : Number(form.horsepower);
    if (isNaN(hp) || hp < 0 || hp > 2000) return setError('Horsepower must be between 0 and 2000.');

    const payload = { ...form, make: form.make.trim(), model: form.model.trim(), year, horsepower: hp };
    setBusy(true);
    try {
      const file = fileRef.current && fileRef.current.files[0];
      if (file) payload.photo = (await api.uploadImage(file)).url;
      if (car) await api.put('/api/cars/' + car._id, payload);
      else await api.post('/api/cars', payload);
      toast(car ? 'Car updated' : 'Car added to your garage');
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" ref={boxRef}>
      <h2>Add a car to your garage</h2>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div>
            <label htmlFor="c-make">Make</label>
            <input id="c-make" type="text" maxLength="40" required placeholder="Toyota"
                   value={form.make} onChange={set('make')} />
          </div>
          <div>
            <label htmlFor="c-model">Model</label>
            <input id="c-model" type="text" maxLength="40" required placeholder="Supra"
                   value={form.model} onChange={set('model')} />
          </div>
          <div>
            <label htmlFor="c-year">Year</label>
            <input id="c-year" type="number" min="1900" max="2027" required placeholder="1998"
                   value={form.year} onChange={set('year')} />
          </div>
          <div>
            <label htmlFor="c-category">Body type</label>
            <select id="c-category" value={form.category} onChange={set('category')}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-engine">Engine</label>
            <input id="c-engine" type="text" maxLength="40" placeholder="2JZ-GTE 3.0 turbo"
                   value={form.engine} onChange={set('engine')} />
          </div>
          <div>
            <label htmlFor="c-hp">Horsepower</label>
            <input id="c-hp" type="number" min="0" max="2000" placeholder="320"
                   value={form.horsepower} onChange={set('horsepower')} />
          </div>
          <div>
            <label htmlFor="c-color">Colour</label>
            <input id="c-color" type="text" maxLength="30" placeholder="Renaissance red"
                   value={form.color} onChange={set('color')} />
          </div>
          <div>
            <label htmlFor="c-photo">Photo</label>
            <input id="c-photo" type="file" accept="image/*" ref={fileRef} />
          </div>
        </div>

        <label htmlFor="c-desc">Notes</label>
        <textarea id="c-desc" rows="2" maxLength="500" placeholder="Modifications, plans, story…"
                  value={form.description} onChange={set('description')} />

        <FormError message={error} />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : car ? 'Save changes' : 'Save car'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
