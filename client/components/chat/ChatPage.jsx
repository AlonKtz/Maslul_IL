import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import { currentUserId } from '../../lib/session';
import ConversationList from './ConversationList';
import FriendList from './FriendList';
import ChatThread from './ChatThread';
import MessageComposer from './MessageComposer';
import MessageSearch from './MessageSearch';

/*
  The chat page. Messages go live over a WebSocket (Socket.io): the socket
  uses the same session cookie as the site, so the server knows who is
  connected. This component owns the connection and hands the pieces to
  the parts of the page. openWith is set when you came here from someone's
  profile with "Message", so that conversation opens straight away.
*/
const idOf = (x) => String((x && x._id) || x);

export default function ChatPage({ friends, openWith }) {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const [status, setStatus] = useState({ text: 'connecting…', ok: false });
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState(null);
  const [threadError, setThreadError] = useState('');
  const [conversations, setConversations] = useState(null);
  const [online, setOnline] = useState({});
  const [typing, setTyping] = useState(false);

  const loadConversations = useCallback(() => {
    api.get('/api/messages/conversations')
      .then((res) => setConversations(res.conversations))
      .catch(() => setConversations([]));
  }, []);

  const openConversation = useCallback((who) => {
    const next = { id: String(who.id), name: who.name, avatar: who.avatar };
    peerRef.current = next;
    setPeer(next);
    setMessages(null);
    setThreadError('');
    setTyping(false);
    // the old messages come over the socket rather than http
    socketRef.current.emit('history:load', { withUserId: next.id }, (res) => {
      if (!res || res.error) return setThreadError((res && res.error) || 'Could not load.');
      setMessages(res.messages);
      loadConversations();   // the unread counts have changed
    });
  }, [loadConversations]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => setStatus({ text: 'connected', ok: true }));
    socket.on('disconnect', () => setStatus({ text: 'disconnected', ok: false }));
    socket.on('connect_error', (err) => {
      setStatus({ text: 'offline', ok: false });
      toast(err.message || 'Chat connection failed', true);
    });

    socket.on('message:new', (msg) => {
      const fromId = idOf(msg.from);
      const other = fromId === String(currentUserId) ? idOf(msg.to) : fromId;
      // into the thread if it is the open conversation, otherwise just a toast
      if (peerRef.current && other === peerRef.current.id) {
        setMessages((list) => (list || []).concat(msg));
      } else if (fromId !== String(currentUserId)) {
        toast('New message from ' + (msg.from.displayName || msg.from.username));
      }
      loadConversations();
    });

    socket.on('typing', (data) => {
      if (peerRef.current && String(data.userId) === peerRef.current.id) setTyping(Boolean(data.typing));
    });

    socket.on('presence', (data) => {
      setOnline((o) => ({ ...o, [String(data.userId)]: Boolean(data.online) }));
    });

    loadConversations();
    return () => socket.disconnect();
  }, [loadConversations]);

  // came here from a profile: open that person straight away
  useEffect(() => {
    if (!openWith) return;
    api.get('/api/users/' + openWith)
      .then((res) => openConversation({ id: res.user._id, name: res.user.displayName || res.user.username, avatar: res.user.avatar }))
      .catch((err) => toast(errorText(err), true));
  }, [openWith, openConversation]);

  // gives back an error message, or nothing when it went through
  function send(text) {
    if (!peerRef.current) return Promise.resolve('Choose somebody to talk to first.');
    return new Promise((resolve) => {
      socketRef.current.emit('message:send', { to: peerRef.current.id, text }, (res) => {
        resolve(!res || res.error ? ((res && res.error) || 'Could not send.') : '');
      });
    });
  }

  function sendTyping(isTyping) {
    if (peerRef.current) socketRef.current.emit('typing', { to: peerRef.current.id, typing: isTyping });
  }

  async function edit(message) {
    let updated = window.prompt('Edit your message:', message.text);
    if (updated === null) return;
    updated = updated.trim();
    if (!updated) return toast('A message cannot be empty.', true);
    if (updated === message.text) return;
    if (updated.length > 1000) return toast('Message is too long.', true);
    try {
      await api.put('/api/messages/' + message._id, { text: updated });
      setMessages((list) => list.map((m) => (m._id === message._id ? { ...m, text: updated } : m)));
      toast('Message updated');
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function remove(message) {
    try {
      await api.del('/api/messages/' + message._id);
      setMessages((list) => list.filter((m) => m._id !== message._id));
      loadConversations();
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="glow">Chat</h1>
          <p className="muted">
            Messages are delivered live over WebSockets{' '}
            <span className="badge" style={{ color: status.ok ? 'var(--ok)' : 'var(--muted)' }}>{status.text}</span>
          </p>
        </div>
      </div>

      <div className="chat-layout">
        <aside className="chat-sidebar card">
          <h2 className="small" style={{ marginTop: 0 }}>Conversations</h2>
          <ConversationList conversations={conversations} onOpen={openConversation} />
          <h2 className="small">Friends</h2>
          <FriendList friends={friends} online={online} onOpen={openConversation} />
        </aside>

        <section className="chat-main card">
          <ChatThread peer={peer} online={peer && online[peer.id]} typing={typing}
                      messages={messages} error={threadError} onEdit={edit} onDelete={remove} />
          <MessageComposer disabled={!peer} onSend={send} onTyping={sendTyping} />
        </section>
      </div>

      <MessageSearch friends={friends} />
    </>
  );
}
