import React, { useState } from 'react';
import Tabs from '../common/Tabs';
import AreaSearch from './AreaSearch';
import MemberSearch from './MemberSearch';
import GroupSearch from './GroupSearch';

/*
  The search page: three tabs, each its own component. The map tab stays
  mounted while hidden, so a drawn area is still there when you come back.
*/
const TABS = [
  { id: 'area', label: 'Area of interest' },
  { id: 'members', label: 'Members' },
  { id: 'groups', label: 'Groups' },
];

export default function SearchPage({ cities, categories }) {
  const [tab, setTab] = useState('area');
  return (
    <>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className={'tab-panel' + (tab === 'area' ? ' is-active' : '')}><AreaSearch cities={cities} /></div>
      <div className={'tab-panel' + (tab === 'members' ? ' is-active' : '')}><MemberSearch /></div>
      <div className={'tab-panel' + (tab === 'groups' ? ' is-active' : '')}><GroupSearch categories={categories} /></div>
    </>
  );
}
