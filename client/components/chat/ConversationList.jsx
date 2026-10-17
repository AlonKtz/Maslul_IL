import React from 'react';

/*
  My conversations, newest first, each with the last message and how many
  are unread. Clicking one opens it.
*/
export default function ConversationList({ conversations, onOpen }) {
  if (!conversations) return null;
  if (!conversations.length) return <p className="muted small">No conversations yet.</p>;

  return conversations.map((c) => {
    const name = c.user.displayName || c.user.username;
    return (
      <button key={c.user._id} className="conversation chat-open" type="button"
              onClick={() => onOpen({ id: c.user._id, name, avatar: c.user.avatar })}>
        <img src={c.user.avatar} alt="" />
        <span className="conversation-body">
          <span className="conversation-name">
            {name}
            {c.unread > 0 && <> <span className="badge badge-race">{c.unread}</span></>}
          </span>
          <span className="muted small">{c.lastMessage.text.slice(0, 38)}</span>
        </span>
      </button>
    );
  });
}
