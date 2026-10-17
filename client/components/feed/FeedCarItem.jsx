import React from 'react';
import PosterBlock from './PosterBlock';

// somebody parked a new car in their garage
export default function FeedCarItem({ car, posterCar }) {
  const specs = [car.engine, car.horsepower ? car.horsepower + ' hp' : '', car.color].filter(Boolean);
  return (
    <article className="card feed-item">
      <div className="feed-head">
        <PosterBlock person={car.owner} car={posterCar} verb="added to their garage" when={car.createdAt} />
        <span className="badge badge-meet">{car.category || 'Car'}</span>
      </div>
      <img className="item-image" src={car.photo || '/img/default-car.svg'} alt=""
           style={{ marginTop: '.6rem', borderRadius: 'var(--radius-sm)' }} />
      <h3 style={{ margin: '.6rem 0 .2rem' }}>
        <a href={'/profile/' + (car.owner ? car.owner.username : '')}>{car.year + ' ' + car.make + ' ' + car.model}</a>
      </h3>
      {specs.length > 0 && <p className="item-meta">{specs.join(' · ')}</p>}
    </article>
  );
}
