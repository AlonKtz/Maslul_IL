import React from 'react';

/*
  My friends, to start a new conversation. The dot next to each name turns
  green while they are connected.
*/
export default function FriendList({ friends, online, onOpen }) {
  if (!friends.length) {
    return <p className="muted small">Add a friend from their profile to start chatting.</p>;
  }
  return (
    <div className="people">
      {friends.map((f) => {
        const name = f.displayName || f.username;
        return (
          <button key={f._id} className="person chat-open" type="button"
                  onClick={() => onOpen({ id: f._id, name, avatar: f.avatar })}>
            <img src={f.avatar} alt="" />
            <span>{name}</span>
            <span className={'dot' + (online[f._id] ? ' is-online' : '')} />
          </button>
        );
      })}
    </div>
  );
}
