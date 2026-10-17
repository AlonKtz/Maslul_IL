import React, { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import { toInputDateTime } from '../../lib/format';
import FormError from '../common/FormError';

/*
  Host a meet or a race, or edit one when `event` is given.

  The race format, circuit and laps only show for a race. The circuit list
  only offers tracks that suit the chosen format (no drag race on a kart
  track), and the total distance is worked out from the track length and the
  lap count. A cover photo is uploaded first and saved with the event.
*/
const EMPTY = {
  title: '', type: 'meet', raceType: '', circuit: '', laps: '10', city: '',
  address: '', startsAt: '', maxAttendees: '0', description: '',
};

export default function EventForm({ event, cities, raceTypes, circuits, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setError('');
    if (event) {
      setForm({
        title: event.title,
        type: event.type,
        raceType: event.raceType || '',
        circuit: event.circuit || '',
        laps: String(event.laps || 10),
        city: event.city,
        address: event.address || '',
        startsAt: toInputDateTime(event.startsAt),
        maxAttendees: String(event.maxAttendees || 0),
        description: event.description || '',
      });
      if (boxRef.current) boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm(EMPTY);
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [event]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // a new format can rule out the circuit that was picked
  function setRaceType(e) {
    const raceType = e.target.value;
    const chosen = circuits.find((c) => c.id === form.circuit);
    const stillFits = !chosen || !raceType || chosen.raceTypes.includes(raceType);
    setForm({ ...form, raceType, circuit: stillFits ? form.circuit : '' });
  }

  const isRace = form.type === 'race';
  const circuit = circuits.find((c) => c.id === form.circuit);
  const unit = circuit ? circuit.unit : 'laps';
  const laps = Number(form.laps) || 0;
  const total = circuit && laps ? '(' + (circuit.lengthKm * laps).toFixed(1) + ' km in total)' : '';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.title.trim().length < 3) return setError('Give the event a title of at least 3 characters.');
    if (!form.city) return setError('Choose the city where it happens.');
    if (!form.startsAt) return setError('Choose the date and time.');
    if (isRace && !form.raceType) return setError('Choose the race format.');
    if (isRace && !form.circuit) return setError('Choose the circuit the race is on.');
    if (isRace && laps < 1) return setError('How many laps or runs?');

    const payload = {
      ...form,
      title: form.title.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      maxAttendees: Number(form.maxAttendees || 0),
      laps: isRace ? laps : 1,
    };
    setBusy(true);
    try {
      const file = fileRef.current && fileRef.current.files[0];
      if (file) payload.coverImage = (await api.uploadImage(file)).url;
      if (event) await api.put('/api/events/' + event._id, payload);
      else await api.post('/api/events', payload);
      toast(event ? 'Event updated' : 'Event published');
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" ref={boxRef}>
      <h2>Host a meet or a race</h2>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div>
            <label htmlFor="ev-title">Title</label>
            <input id="ev-title" type="text" maxLength="80" required placeholder="Friday night cruise"
                   value={form.title} onChange={set('title')} />
          </div>
          <div>
            <label htmlFor="ev-type">Type</label>
            <select id="ev-type" value={form.type} onChange={set('type')}>
              <option value="meet">Car meet</option>
              <option value="race">Race</option>
            </select>
          </div>
          {isRace && (
            <>
              <div>
                <label htmlFor="ev-racetype">Race format</label>
                <select id="ev-racetype" value={form.raceType} onChange={setRaceType}>
                  <option value="">Choose…</option>
                  {raceTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ev-circuit">Circuit</label>
                <select id="ev-circuit" value={form.circuit} onChange={set('circuit')}>
                  <option value="">Choose a track…</option>
                  {circuits
                    .filter((c) => !form.raceType || c.raceTypes.includes(form.raceType))
                    .map((c) => <option key={c.id} value={c.id}>{c.name + ' (' + c.lengthKm + ' km)'}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ev-laps">
                  <span>{unit.charAt(0).toUpperCase() + unit.slice(1)}</span> <span className="hint">{total}</span>
                </label>
                <input id="ev-laps" type="number" min="1" max="500" value={form.laps} onChange={set('laps')} />
              </div>
            </>
          )}
          <div>
            <label htmlFor="ev-city">City</label>
            <select id="ev-city" value={form.city} onChange={set('city')}>
              <option value="">Choose a city…</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ev-address">Meeting point <span className="hint">(optional)</span></label>
            <input id="ev-address" type="text" maxLength="120" placeholder="Port parking lot, gate 3"
                   value={form.address} onChange={set('address')} />
          </div>
          <div>
            <label htmlFor="ev-starts">Date &amp; time</label>
            <input id="ev-starts" type="datetime-local" value={form.startsAt} onChange={set('startsAt')} />
          </div>
          <div>
            <label htmlFor="ev-max">Attendee limit <span className="hint">(0 = no limit)</span></label>
            <input id="ev-max" type="number" min="0" max="10000" value={form.maxAttendees} onChange={set('maxAttendees')} />
          </div>
          <div>
            <label htmlFor="ev-image">Cover photo <span className="hint">(optional)</span></label>
            <input id="ev-image" type="file" accept="image/*" ref={fileRef} />
          </div>
        </div>

        <label htmlFor="ev-desc">Description</label>
        <textarea id="ev-desc" rows="3" maxLength="1000" placeholder="What is happening, what to bring, who it is for…"
                  value={form.description} onChange={set('description')} />

        <FormError message={error} />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : event ? 'Save changes' : 'Publish event'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
