import React, { useRef, useState } from 'react';
import FormError from '../common/FormError';

/*
  The box at the bottom of the chat. onSend gets the text and gives back an
  error message (or nothing). While typing it tells the other side, and
  stops a moment after the last key press.
*/
export default function MessageComposer({ disabled, onSend, onTyping }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const typingTimer = useRef(null);

  function change(e) {
    setText(e.target.value);
    onTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1200);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const clean = text.trim();
    if (!clean) return setError('Write something first.');
    if (clean.length > 1000) return setError('Message is too long.');
    setText('');
    const problem = await onSend(clean);
    if (problem) setError(problem);
  }

  return (
    <>
      <form className="chat-form" onSubmit={submit} noValidate>
        <input type="text" maxLength="1000" autoComplete="off" placeholder="Write a message…"
               value={text} onChange={change} disabled={disabled} />
        <button className="btn btn-primary" type="submit" disabled={disabled}>Send</button>
      </form>
      <FormError message={error} />
    </>
  );
}
