import React from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  The buttons at the top of a group page. A member can leave, anyone else
  can join (or ask to, for a private group). The manager gets Edit, which
  opens the settings (GroupSettings listens for group:edit), and Delete.
*/
export default function GroupActions({ groupId, isManager, isMember }) {
  async function join() {
    try {
      const res = await api.post('/api/groups/' + groupId + '/join');
      toast(res.pending ? 'Request sent to the manager' : 'You joined the group');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function leave() {
    if (!window.confirm('Leave this group?')) return;
    try {
      await api.post('/api/groups/' + groupId + '/leave');
      toast('You left the group');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this group? Its events will be removed too.')) return;
    try {
      await api.del('/api/groups/' + groupId);
      toast('Group deleted');
      window.setTimeout(() => { window.location.href = '/groups'; }, 600);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  const openSettings = () => document.dispatchEvent(new CustomEvent('group:edit'));

  return (
    <div className="form-actions" style={{ margin: 0 }}>
      {isManager ? (
        <>
          <button className="btn btn-ghost" type="button" onClick={openSettings}>Edit group</button>
          <button className="btn btn-ghost" type="button" onClick={remove}>Delete group</button>
        </>
      ) : isMember ? (
        <button className="btn btn-ghost" type="button" onClick={leave}>Leave group</button>
      ) : (
        <button className="btn btn-primary" type="button" onClick={join}>Join group</button>
      )}
    </div>
  );
}
