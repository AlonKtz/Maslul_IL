import React from 'react';
import NumberPlate from './NumberPlate';
import { isMine } from '../../lib/session';

/*
  One car, parked in its own numbered bay. The owner gets Edit and Delete;
  what they do is up to the page (onEdit, onDelete).
*/
export default function CarCard({ car, bay, onEdit, onDelete }) {
  const chips = [car.engine, car.horsepower ? car.horsepower + ' hp' : '', car.color].filter(Boolean);
  const owner = car.owner;

  return (
    <article className="item-card bay-card">
      <div className="bay-photo">
        <img src={car.photo || '/img/default-car.svg'} alt="" />
        <span className="bay-number">{'Bay ' + String(bay).padStart(2, '0')}</span>
        <span className="badge bay-type">{car.category}</span>
      </div>
      <div className="bay-body">
        <NumberPlate carId={car._id} />
        <h3 className="item-title">{car.year + ' ' + car.make + ' ' + car.model}</h3>
        {chips.length > 0 && (
          <div className="chips">{chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        )}
        {car.description && <p className="item-meta">{car.description}</p>}
        <p className="item-meta bay-owner">
          {owner ? <>Parked by <a href={'/profile/' + owner.username}>{owner.displayName || owner.username}</a></> : 'unknown owner'}
        </p>
      </div>
      {owner && isMine(owner._id) && (
        <div className="item-actions">
          <button className="btn btn-ghost" type="button" onClick={() => onEdit(car)}>Edit</button>
          <button className="btn btn-ghost" type="button" onClick={() => onDelete(car)}>Delete</button>
        </div>
      )}
    </article>
  );
}
