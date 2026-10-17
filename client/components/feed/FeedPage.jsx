import React, { useState } from 'react';
import Tabs from '../common/Tabs';
import FeedTimeline from './FeedTimeline';
import MyGroups from './MyGroups';
import PeopleYouMayKnow from './PeopleYouMayKnow';

/*
  The feed page: the tabs, the timeline, and the two boxes on the side.
  Each part is its own component; this only lays them out.
*/
const TABS = [
  { id: 'all', label: 'Everything' },
  { id: 'friends', label: 'Friends' },
  { id: 'groups', label: 'My groups' },
];

export default function FeedPage() {
  const [filter, setFilter] = useState('all');
  return (
    <>
      <Tabs tabs={TABS} active={filter} onChange={setFilter} />
      <div className="layout-split">
        {/* a new tab gets a fresh timeline, starting from page one */}
        <FeedTimeline key={filter} filter={filter} />
        <aside>
          <MyGroups />
          <PeopleYouMayKnow />
        </aside>
      </div>
    </>
  );
}
