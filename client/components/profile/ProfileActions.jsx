import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  The buttons at the top of a profile. On my own profile: Edit profile,
  which opens ProfileEditForm (it listens for profile:edit). On someone
  else's: add or remove them as a friend, and Message them.
*/
export default function ProfileActions({ profileId, isSelf, isFriend, requestSent }) {
  const [sent, setSent] = useState(Boolean(requestSent));
  const [busy, setBusy] = useState(false);

  async function addFriend() {
    setBusy(true);
    try {
      await api.post('/api/users/' + profileId + '/friend-request');
      toast('Friend request sent');
      setSent(true);
    } catch (err) {
      toast(errorText(err), true);
    } finally {
      setBusy(false);
    }
  }

  async function unfriend() {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await api.post('/api/users/' + profileId + '/unfriend');
      toast('Friend removed');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  if (isSelf) {
    return (
      <div className="form-actions" style={{ margin: 0 }}>
        <button className="btn btn-ghost" type="button"
                onClick={() => document.dispatchEvent(new CustomEvent('profile:edit'))}>
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <div className="form-actions" style={{ margin: 0 }}>
      {isFriend ? (
        <button className="btn btn-ghost" type="button" onClick={unfriend}>Remove friend</button>
      ) : sent ? (
        <button className="btn btn-ghost" type="button" disabled>Request sent</button>
      ) : (
        <button className="btn btn-primary" type="button" onClick={addFriend} disabled={busy}>Add friend</button>
      )}
      <a className="btn btn-ghost" href={'/chat?to=' + profileId}>Message</a>
    </div>
  );
}
