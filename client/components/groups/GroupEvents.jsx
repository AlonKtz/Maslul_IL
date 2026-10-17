import React, { useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

// the meets and races hosted in this group (GET /api/events?group=<id>)
export default function GroupEvents({ groupId }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/events', { group: groupId })
      .then((res) => setEvents(res.events))
      .catch((err) => setError(errorText(err)));
  }, [groupId]);

  let body;
  if (error) body = <Empty>{error}</Empty>;
  else if (!events) body = <Loading />;
  else if (!events.length) body = <Empty>This group has no upcoming events.</Empty>;
  else {
    body = events.map((ev) => (
      <article className="item-card" key={ev._id}>
        <img className="item-image" src={ev.coverImage || '/img/default-event.svg'} alt="" />
        <div className="item-body">
          <span className={'badge ' + (ev.type === 'race' ? 'badge-race' : 'badge-meet')}>
            {ev.type === 'race' ? (ev.raceType || 'Race') : 'Meet'}
          </span>
          <h3 className="item-title"><a href={'/events/' + ev._id}>{ev.title}</a></h3>
          <p className="item-meta">{ev.city}</p>
          <p className="item-meta">{formatDateTime(ev.startsAt)}</p>
        </div>
      </article>
    ));
  }

  return (
    <section>
      <h2>Events from this group</h2>
      <div className="grid">{body}</div>
    </section>
  );
}
