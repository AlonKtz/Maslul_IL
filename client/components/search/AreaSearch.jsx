import React, { useState } from 'react';
import CanvasMap from './CanvasMap';

/*
  "Draw where you are willing to travel": the satellite map (CanvasMap)
  with a choice between meets and races or items for sale.
*/
export default function AreaSearch({ cities }) {
  const [mode, setMode] = useState('events');

  return (
    <section className="card">
      <h2>Draw where you are willing to travel</h2>
      <p className="muted small">
        Outline an area on the map and Maslul finds everything happening inside it.
        The search runs against the real coordinates stored for each event.
      </p>

      <div className="form-actions" style={{ marginBottom: '1rem' }}>
        <label className="small" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          Looking for
          <select style={{ width: 'auto' }} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="events">Meets &amp; races</option>
            <option value="listings">Items for sale</option>
          </select>
        </label>
      </div>

      <CanvasMap cities={cities} mode={mode} />
    </section>
  );
}
