import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import { formatDateTime } from '../../lib/format';
import { isMine } from '../../lib/session';
import FormError from './FormError';

/*
  The comments under an event, or the questions under a listing.

  url is where they live (/api/events/<id>/comments). The server already put
  the existing ones in the page, so the first render needs no request. The
  texts (label, placeholder, button) differ between the two pages.
*/
export default function Comments({
  url, initial, label = 'Add a comment', placeholder = 'Ask a question or say you are coming…',
  buttonText = 'Post comment', postedText = 'Comment posted', removedText = 'Comment removed',
}) {
  const [comments, setComments] = useState(initial || []);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function post(e) {
    e.preventDefault();
    setError('');
    const clean = text.trim();
    if (!clean) return setError('Write something first.');
    if (clean.length > 500) return setError('Comments are limited to 500 characters.');

    setBusy(true);
    try {
      const res = await api.post(url, { text: clean });
      setComments(res.comments);
      setText('');
      toast(postedText);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    try {
      await api.del(url + '/' + c._id);
      setComments((list) => list.filter((x) => x._id !== c._id));
      toast(removedText);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <>
      <form onSubmit={post} noValidate>
        <label htmlFor="comment-text" className="small">{label}</label>
        <textarea id="comment-text" rows="2" maxLength="500" placeholder={placeholder}
                  value={text} onChange={(e) => setText(e.target.value)} />
        <FormError message={error} />
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Posting…' : buttonText}</button>
        </div>
      </form>

      <div>
        {!comments.length && <p className="muted small">No comments yet.</p>}
        {comments.map((c) => (
          <div className="comment" key={c._id}>
            <img src={c.author ? c.author.avatar : '/img/default-avatar.svg'} alt="" />
            <div className="comment-body">
              <div className="comment-author">
                {c.author ? (c.author.displayName || c.author.username) : 'member'}{' '}
                <span className="muted small">{formatDateTime(c.createdAt)}</span>
              </div>
              <div>{c.text}</div>
            </div>
            {c.author && isMine(c.author._id) && (
              <button className="btn btn-ghost small" type="button" onClick={() => remove(c)}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
