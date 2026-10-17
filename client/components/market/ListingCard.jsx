import React from 'react';
import { formatPrice } from '../../lib/format';
import { isMine } from '../../lib/session';

/*
  One item for sale. The seller gets Edit, Mark sold and Delete; everybody
  else gets View.
*/
export default function ListingCard({ listing, onEdit, onToggleSold, onDelete }) {
  const isSeller = listing.seller && isMine(listing.seller._id);
  const photo = listing.photos && listing.photos.length ? listing.photos[0] : '/img/default-car.svg';
  const carLine = [listing.make, listing.model, listing.year].filter(Boolean).join(' ');
  const sold = listing.status === 'sold';

  return (
    <article className="item-card">
      <img className="item-image" src={photo} alt="" />
      <div className="item-body">
        <span className="badge">{listing.category}</span>
        {sold && <> <span className="badge badge-sold">Sold</span></>}
        <h3 className="item-title"><a href={'/market/' + listing._id}>{listing.title}</a></h3>
        <p className="price">{formatPrice(listing.price)}</p>
        {carLine && <p className="item-meta">{carLine}</p>}
        <p className="item-meta">{listing.condition + ' · ' + listing.city}</p>
        <p className="item-meta">
          {listing.seller ? (listing.seller.displayName || listing.seller.username) : 'member'}
        </p>
      </div>
      <div className="item-actions">
        {isSeller ? (
          <>
            <button className="btn btn-ghost" type="button" onClick={() => onEdit(listing)}>Edit</button>
            <button className="btn btn-ghost" type="button" onClick={() => onToggleSold(listing)}>
              {sold ? 'Put back on sale' : 'Mark sold'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => onDelete(listing)}>Delete</button>
          </>
        ) : (
          <a className="btn btn-ghost" href={'/market/' + listing._id}>View</a>
        )}
      </div>
    </article>
  );
}
