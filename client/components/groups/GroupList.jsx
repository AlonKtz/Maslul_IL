import React from 'react';
import GroupCard from './GroupCard';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

// a grid of GroupCards, or a message when there are none
export default function GroupList({ groups, emptyText, onJoin, onLeave, onDelete }) {
  if (!groups) return <div className="grid"><Loading /></div>;
  if (!groups.length) return <div className="grid"><Empty>{emptyText}</Empty></div>;
  return (
    <div className="grid">
      {groups.map((g) => (
        <GroupCard key={g._id} group={g} onJoin={onJoin} onLeave={onLeave} onDelete={onDelete} />
      ))}
    </div>
  );
}
