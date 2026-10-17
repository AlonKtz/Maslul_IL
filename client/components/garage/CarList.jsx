import React from 'react';
import CarCard from './CarCard';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

// the parking bays: a grid of CarCards, or a message when there are none
export default function CarList({ cars, emptyText, onEdit, onDelete }) {
  if (!cars) return <div className="grid bays"><Loading /></div>;
  if (!cars.length) return <div className="grid bays"><Empty>{emptyText}</Empty></div>;
  return (
    <div className="grid bays">
      {cars.map((car, i) => (
        <CarCard key={car._id} car={car} bay={i + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
