import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { isMine } from '../../lib/session';

/*
  The open conversation: the person at the top (with online / offline), the
  messages, and "… is typing". Scrolls to the newest message whenever the
  list grows.
*/
export default function ChatThread({ peer, online, typing, messages, error, onEdit, onDelete }) {
  const threadRef = useRef(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  let body;
  if (!peer) body = <p className="empty">Choose a conversation on the left.</p>;
  else if (error) body = <p className="empty">{error}</p>;
  else if (!messages) body = <p className="loading">Loading…</p>;
  else if (!messages.length) body = <p className="empty">No messages yet. Say hello.</p>;
  else {
    body = messages.map((m) => (
      <MessageBubble key={m._id} message={m} mine={isMine(m.from._id || m.from)} onEdit={onEdit} onDelete={onDelete} />
    ));
  }

  return (
    <>
      <header className="chat-header">
        {peer && <img src={peer.avatar || '/img/default-avatar.svg'} alt="" />}
        <div>
          <strong>{peer ? peer.name : 'Pick somebody to talk to'}</strong>
          <p className="muted small" style={{ margin: 0 }}>{peer ? (online ? 'online' : 'offline') : ''}</p>
        </div>
      </header>

      <div className="chat-thread" ref={threadRef}>{body}</div>

      <p className="muted small" style={{ minHeight: '1.2em' }}>{typing && peer ? peer.name + ' is typing…' : ''}</p>
    </>
  );
}
