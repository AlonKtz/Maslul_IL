import React, { useEffect, useState } from 'react';
import GroupForm from './GroupForm';

/*
  The manager's settings for the group: the same form as starting a group,
  filled in. It stays closed until "Edit group" (GroupActions) is pressed,
  and the page reloads after saving so every part shows the new details.
*/
export default function GroupSettings({ group, categories }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    document.addEventListener('group:edit', toggle);
    return () => document.removeEventListener('group:edit', toggle);
  }, []);

  if (!open) return null;
  return (
    <GroupForm group={group} categories={categories} title="Group settings"
               onSaved={() => window.setTimeout(() => window.location.reload(), 700)} />
  );
}
