import React, { useState } from 'react';
import Tabs from '../common/Tabs';
import AdminOverview from './AdminOverview';
import AdminMembers from './AdminMembers';
import AdminContent from './AdminContent';

/*
  The admin page: the counts on top, then two tabs, members and recent
  content. The content tab loads the first time it is opened. Any change
  bumps refreshKey so the counts update.
*/
const TABS = [
  { id: 'members', label: 'Members' },
  { id: 'content', label: 'Recent content' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('members');
  const [opened, setOpened] = useState({ members: true });
  const [refreshKey, setRefreshKey] = useState(0);
  const changed = () => setRefreshKey((n) => n + 1);

  function open(id) {
    setTab(id);
    setOpened((o) => ({ ...o, [id]: true }));
  }

  return (
    <>
      <AdminOverview refreshKey={refreshKey} />
      <Tabs tabs={TABS} active={tab} onChange={open} />
      <div className={'tab-panel' + (tab === 'members' ? ' is-active' : '')}>
        <AdminMembers onChanged={changed} />
      </div>
      <div className={'tab-panel' + (tab === 'content' ? ' is-active' : '')}>
        {opened.content && <AdminContent onChanged={changed} />}
      </div>
    </>
  );
}
