import React from 'react';
import ListingCard from './ListingCard';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

// a grid of ListingCards, or a message when there are none
export default function ListingList({ listings, emptyText, onEdit, onToggleSold, onDelete }) {
  if (!listings) return <div className="grid"><Loading /></div>;
  if (!listings.length) return <div className="grid"><Empty>{emptyText}</Empty></div>;
  return (
    <div className="grid">
      {listings.map((li) => (
        <ListingCard key={li._id} listing={li} onEdit={onEdit} onToggleSold={onToggleSold} onDelete={onDelete} />
      ))}
    </div>
  );
}
