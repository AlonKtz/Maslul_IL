import React from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

// "Delete event" for the host, then back to the list of events
export default function DeleteEventButton({ eventId }) {
  async function remove() {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.del('/api/events/' + eventId);
      toast('Event deleted');
      window.setTimeout(() => { window.location.href = '/events'; }, 500);
    } catch (err) {
      toast(errorText(err), true);
    }
  }
  return <button className="btn btn-ghost" type="button" onClick={remove}>Delete event</button>;
}
