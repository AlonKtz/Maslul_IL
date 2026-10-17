import React from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  Deletes my own account, with everything I made. Asks twice, because it
  cannot be undone.
*/
export default function DeleteAccountButton({ profileId }) {
  async function remove() {
    if (!window.confirm('Delete your account? Your cars, events and listings go with it. This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure?')) return;
    try {
      const res = await api.del('/api/users/' + profileId);
      window.location.href = (res && res.redirect) || '/';
    } catch (err) {
      toast(errorText(err), true);
    }
  }
  return <button className="btn btn-ghost" type="button" onClick={remove}>Delete my account</button>;
}
