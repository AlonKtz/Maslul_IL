import React from 'react';
import { currentUserId, isMine } from '../../lib/session';

/*
  One group in the grid. The manager can delete it from here; members can
  leave; everybody else can join (or ask to, for a private group).
*/
export default function GroupCard({ group, onJoin, onLeave, onDelete }) {
  const members = group.members || [];
  const isManager = group.admin && isMine(group.admin._id);
  const isMember = members.some((m) => String(m._id || m) === String(currentUserId));

  return (
    <article className="item-card">
      <img className="item-image" src={group.coverImage || '/img/default-cover.svg'} alt="" />
      <div className="item-body">
        <span className="badge">{group.category}</span>
        {group.isPrivate && <> <span className="badge badge-private">Private</span></>}
        <h3 className="item-title"><a href={'/groups/' + group._id}>{group.name}</a></h3>
        {group.brand && <p className="item-meta">{group.brand}</p>}
        <p className="item-meta">{members.length + (members.length === 1 ? ' member' : ' members')}</p>
        <p className="item-meta">
          {'Managed by ' + (group.admin ? (group.admin.displayName || group.admin.username) : 'unknown')}
        </p>
      </div>
      <div className="item-actions">
        <a className="btn btn-ghost" href={'/groups/' + group._id}>Open</a>
        {isManager && <button className="btn btn-ghost" type="button" onClick={() => onDelete(group)}>Delete</button>}
        {!isManager && isMember && <button className="btn btn-ghost" type="button" onClick={() => onLeave(group)}>Leave</button>}
        {!isManager && !isMember && <button className="btn btn-primary" type="button" onClick={() => onJoin(group)}>Join</button>}
      </div>
    </article>
  );
}
