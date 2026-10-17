import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  "I am going" / "Cancel attendance" on an event page. After a change the
  page reloads, so the faces in the "Going" box match the new count.
*/
export default function AttendButton({ eventId, attending }) {
  const [going, setGoing] = useState(Boolean(attending));
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await api.post('/api/events/' + eventId + '/attend');
      setGoing(res.attending);
      toast(res.attending ? 'You are going' : 'You are no longer going');
      window.setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast(errorText(err), true);
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-primary" type="button" onClick={toggle} disabled={busy}>
      {going ? 'Cancel attendance' : 'I am going'}
    </button>
  );
}
