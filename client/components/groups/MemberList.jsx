import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  The group's members. The manager gets an × next to everyone but
  themselves, to remove that member from the group.
*/
export default function MemberList({ groupId, members, adminId, isManager }) {
  const [list, setList] = useState(members || []);

  async function remove(member) {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await api.post('/api/groups/' + groupId + '/remove-member', { userId: member._id });
      toast('Member removed');
      setList((l) => l.filter((m) => m._id !== member._id));
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <section className="card" style={{ marginTop: 0 }}>
      <h2 className="small">Members</h2>
      <div className="people">
        {list.map((m) => (
          <span className="person" key={m._id}>
            <a href={'/profile/' + m.username}
               style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'inherit', textDecoration: 'none' }}>
              <img src={m.avatar} alt="" />
              <span>{m.displayName || m.username}</span>
            </a>
            {isManager && String(m._id) !== String(adminId) && (
              <button className="btn btn-ghost small" type="button" onClick={() => remove(m)}>×</button>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
