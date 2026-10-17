import React from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  The seller's buttons on their own listing: mark it sold (or put it back on
  sale) and delete it. Marking sold reloads the page so the "Sold" badge
  shows; deleting goes back to the market.
*/
export default function SellerActions({ listingId, sold }) {
  async function toggleSold() {
    try {
      const res = await api.post('/api/listings/' + listingId + '/sold');
      toast(res.status === 'sold' ? 'Marked as sold' : 'Back on sale');
      window.setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.del('/api/listings/' + listingId);
      toast('Listing deleted');
      window.setTimeout(() => { window.location.href = '/market'; }, 500);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <div className="form-actions" style={{ margin: 0 }}>
      <button className="btn btn-ghost" type="button" onClick={toggleSold}>
        {sold ? 'Put back on sale' : 'Mark as sold'}
      </button>
      <button className="btn btn-ghost" type="button" onClick={remove}>Delete</button>
    </div>
  );
}
