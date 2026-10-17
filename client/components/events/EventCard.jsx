import React from 'react';
import { formatDateTime } from '../../lib/format';
import { isMine } from '../../lib/session';

/*
  One meet or race in the grid. The host gets Edit and Delete, everybody
  else gets "Going / not going". What the buttons do is up to the page.
*/
export default function EventCard({ event, onEdit, onDelete, onAttend }) {
  const isHost = event.host && isMine(event.host._id);
  const isRace = event.type === 'race';

  return (
    <article className="item-card">
      <img className="item-image" src={event.coverImage || '/img/default-event.svg'} alt="" />
      <div className="item-body">
        <span className={'badge ' + (isRace ? 'badge-race' : 'badge-meet')}>
          {isRace ? (event.raceType || 'Race') : 'Meet'}
        </span>
        <h3 className="item-title"><a href={'/events/' + event._id}>{event.title}</a></h3>
        <p className="item-meta">{event.address ? event.city + ' · ' + event.address : event.city}</p>
        <p className="item-meta">{formatDateTime(event.startsAt)}</p>
        <p className="item-meta">
          {'Hosted by ' + (event.host ? (event.host.displayName || event.host.username) : 'unknown')}
        </p>
      </div>
      <div className="item-actions">
        {isHost ? (
          <>
            <button className="btn btn-ghost" type="button" onClick={() => onEdit(event)}>Edit</button>
            <button className="btn btn-ghost" type="button" onClick={() => onDelete(event)}>Delete</button>
          </>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={() => onAttend(event)}>Going / not going</button>
        )}
        <a className="btn btn-ghost" href={'/events/' + event._id}>Open</a>
      </div>
    </article>
  );
}
