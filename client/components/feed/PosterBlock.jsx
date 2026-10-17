import React from 'react';
import { formatDateTime } from '../../lib/format';

/*
  The top of every feed item: avatar, name, what they did, where they are
  from and what they drive.
*/
export default function PosterBlock({ person, car, verb, when }) {
  const name = person ? (person.displayName || person.username) : 'member';
  const profile = person ? '/profile/' + person.username : '#';
  const details = [];
  if (person && person.location) details.push(person.location);
  if (car) details.push('drives a ' + car.year + ' ' + car.make + ' ' + car.model);

  return (
    <>
      <a href={profile}>
        <img src={person ? person.avatar : '/img/default-avatar.svg'} alt="" />
      </a>
      <div>
        <a className="feed-name" href={profile}><strong>{name}</strong></a>
        <span className="muted small"> {verb}</span>
        {details.length > 0 && <p className="feed-who small">{details.join(' · ')}</p>}
        <p className="muted small" style={{ margin: 0 }}>{formatDateTime(when)}</p>
      </div>
    </>
  );
}
