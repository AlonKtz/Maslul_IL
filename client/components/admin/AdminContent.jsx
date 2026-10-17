import React, { useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import { formatDate, formatPrice } from '../../lib/format';

/*
  The newest events and listings, each with Remove. An admin can delete
  anyone's content: the ownership check in each controller already lets
  the admin role through, so the normal delete addresses are used.
*/
export default function AdminContent({ onChanged }) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.get('/api/admin/content').then(setContent).catch(() => setContent({ events: [], listings: [] }));
  }, []);

  async function remove(kind, item) {
    if (!window.confirm('Remove this ' + kind + '? This cannot be undone.')) return;
    try {
      await api.del((kind === 'event' ? '/api/events/' : '/api/listings/') + item._id);
      toast(kind === 'event' ? 'Event removed' : 'Listing removed');
      const key = kind === 'event' ? 'events' : 'listings';
      setContent((c) => ({ ...c, [key]: c[key].filter((x) => x._id !== item._id) }));
      onChanged();
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  const events = content ? content.events : [];
  const listings = content ? content.listings : [];
  const nothing = <p className="muted small">Nothing yet.</p>;

  return (
    <>
      <section className="card">
        <h2>Newest events</h2>
        {content && !events.length && nothing}
        {events.map((ev) => (
          <div className="comment" key={ev._id}>
            <div className="comment-body">
              <div className="comment-author"><a href={'/events/' + ev._id}>{ev.title}</a></div>
              <div className="muted small">
                {(ev.host ? (ev.host.displayName || ev.host.username) : 'unknown') + ' · ' + ev.city + ' · ' + formatDate(ev.createdAt)}
              </div>
            </div>
            <button className="btn btn-ghost small" type="button" onClick={() => remove('event', ev)}>Remove</button>
          </div>
        ))}
      </section>
      <section className="card">
        <h2>Newest listings</h2>
        {content && !listings.length && nothing}
        {listings.map((li) => (
          <div className="comment" key={li._id}>
            <div className="comment-body">
              <div className="comment-author"><a href={'/market/' + li._id}>{li.title}</a></div>
              <div className="muted small">
                {(li.seller ? (li.seller.displayName || li.seller.username) : 'unknown') + ' · ' + formatPrice(li.price) + ' · ' + formatDate(li.createdAt)}
              </div>
            </div>
            <button className="btn btn-ghost small" type="button" onClick={() => remove('listing', li)}>Remove</button>
          </div>
        ))}
      </section>
    </>
  );
}
