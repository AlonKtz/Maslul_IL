import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import GroupFilters from '../groups/GroupFilters';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

/*
  The groups tab on the search page: the same filters as the groups page
  (GroupFilters), with simple cards linking to each group.
*/
export default function GroupSearch({ categories }) {
  const [groups, setGroups] = useState(undefined);

  async function search(params) {
    setGroups(null);
    try {
      const res = await api.get('/api/groups/search', params);
      setGroups(res.groups);
      toast(res.total + ' group' + (res.total === 1 ? '' : 's') + ' found');
    } catch (err) {
      setGroups(undefined);
      toast(errorText(err), true);
    }
  }

  let results = null;
  if (groups === null) results = <Loading text="Searching…" />;
  else if (groups && !groups.length) results = <Empty>No group matched those filters.</Empty>;
  else if (groups) {
    results = groups.map((g) => {
      const members = (g.members || []).length;
      return (
        <article className="item-card" key={g._id}>
          <img className="item-image" src={g.coverImage || '/img/default-cover.svg'} alt="" />
          <div className="item-body">
            <span className="badge">{g.category}</span>
            {g.isPrivate && <> <span className="badge badge-private">Private</span></>}
            <h3 className="item-title"><a href={'/groups/' + g._id}>{g.name}</a></h3>
            {g.brand && <p className="item-meta">{g.brand}</p>}
            <p className="item-meta">{members + (members === 1 ? ' member' : ' members')}</p>
          </div>
        </article>
      );
    });
  }

  return (
    <>
      <div style={{ marginTop: '1.25rem' }}>
        <GroupFilters categories={categories} title="Find groups" buttonText="Search groups"
                      onSearch={search} onClear={() => setGroups(undefined)} />
      </div>
      <div className="grid">{results}</div>
    </>
  );
}
