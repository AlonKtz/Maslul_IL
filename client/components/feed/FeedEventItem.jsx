import React from 'react';
import PosterBlock from './PosterBlock';
import { formatDateTime } from '../../lib/format';

// a meet or race a friend is hosting, or one in my groups
export default function FeedEventItem({ event, car }) {
  const isRace = event.type === 'race';
  return (
    <article className="card feed-item">
      <div className="feed-head">
        <PosterBlock person={event.host} car={car} when={event.createdAt}
                     verb={event.group ? 'is hosting in ' + event.group.name : 'is hosting'} />
        <span className={'badge ' + (isRace ? 'badge-race' : 'badge-meet')}>
          {isRace ? (event.raceType || 'Race') : 'Meet'}
        </span>
      </div>
      <h3 style={{ margin: '.6rem 0 .2rem' }}><a href={'/events/' + event._id}>{event.title}</a></h3>
      <p className="item-meta">{event.city} · {formatDateTime(event.startsAt)}</p>
      {event.description && <p className="muted small">{event.description.slice(0, 160)}</p>}
      <div className="form-actions" style={{ marginTop: '.75rem' }}>
        <a className="btn btn-ghost" href={'/events/' + event._id}>Open</a>
        <span className="muted small">{(event.attendees || []).length} going</span>
      </div>
    </article>
  );
}
