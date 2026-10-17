import React from 'react';
import EventCard from './EventCard';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

// a grid of EventCards, or a message when there are none
export default function EventList({ events, emptyText, onEdit, onDelete, onAttend }) {
  if (!events) return <div className="grid"><Loading /></div>;
  if (!events.length) return <div className="grid"><Empty>{emptyText}</Empty></div>;
  return (
    <div className="grid">
      {events.map((ev) => (
        <EventCard key={ev._id} event={ev} onEdit={onEdit} onDelete={onDelete} onAttend={onAttend} />
      ))}
    </div>
  );
}
