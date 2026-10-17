import React from 'react';
import NumberPlate from './NumberPlate';

/*
  The spotlight at the top of the garage: the most powerful car I own, with
  a horsepower dial (it goes round to 1000 hp) and numbers for the whole
  garage.
*/
export default function Showroom({ cars }) {
  if (!cars) return <section className="showroom" />;
  if (!cars.length) {
    return (
      <section className="showroom">
        <div className="showroom-empty">
          <h2>Your showroom is empty</h2>
          <p className="muted">Add your first car and it takes the spotlight here.</p>
        </div>
      </section>
    );
  }

  const star = cars.slice().sort((a, b) => (b.horsepower || 0) - (a.horsepower || 0))[0];
  const totalHp = cars.reduce((sum, c) => sum + (c.horsepower || 0), 0);
  const oldest = Math.min(...cars.map((c) => c.year));
  const dial = Math.min(100, Math.round(((star.horsepower || 0) / 1000) * 100));

  return (
    <section className="showroom">
      <div className="showroom-photo"><img src={star.photo || '/img/default-car.svg'} alt="" /></div>
      <div className="showroom-info">
        <p className="showroom-kicker">In the spotlight</p>
        <h2>{star.year + ' ' + star.make + ' ' + star.model}</h2>
        <NumberPlate carId={star._id} />
        <div className="showroom-gauges">
          <div className="dial" style={{ '--dial': dial }}>
            <div><strong>{star.horsepower || 0}</strong><span>hp</span></div>
          </div>
          <ul className="showroom-specs">
            <li><span>Engine</span>{star.engine || 'unknown'}</li>
            <li><span>Colour</span>{star.color || 'unknown'}</li>
            <li><span>Body</span>{star.category || ''}</li>
          </ul>
        </div>
        <div className="showroom-stats">
          <div><strong>{cars.length}</strong><span>{cars.length === 1 ? 'car' : 'cars'}</span></div>
          <div><strong>{totalHp.toLocaleString('en-US')}</strong><span>total hp</span></div>
          <div><strong>{oldest}</strong><span>oldest</span></div>
        </div>
      </div>
    </section>
  );
}
