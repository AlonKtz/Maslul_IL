import React, { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import Tabs from '../common/Tabs';
import GroupForm from './GroupForm';
import GroupFilters from './GroupFilters';
import GroupList from './GroupList';

/*
  Groups: start one (GroupForm), find one (GroupFilters), and two tabs, all
  groups and the ones I belong to. categories come from the server.
*/
const TABS = [
  { id: 'all', label: 'All groups' },
  { id: 'mine', label: 'My groups' },
];
const EMPTY_TEXT = { all: 'No groups yet. Start the first one.', mine: 'You have not joined any group yet.' };

export default function GroupsPage({ categories }) {
  const [tab, setTab] = useState('all');
  const [groups, setGroups] = useState(null);
  const [emptyText, setEmptyText] = useState(EMPTY_TEXT.all);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback((which) => {
    setGroups(null);
    setEmptyText(EMPTY_TEXT[which]);
    api.get('/api/groups', which === 'mine' ? { mine: 'true' } : {})
      .then((res) => setGroups(res.groups))
      .catch((err) => { setGroups([]); setEmptyText(errorText(err)); });
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  function search(params) {
    setGroups(null);
    api.get('/api/groups/search', params)
      .then((res) => {
        setTab('all');
        setGroups(res.groups);
        setEmptyText('No group matched those filters.');
        toast(res.total + ' group' + (res.total === 1 ? '' : 's') + ' found');
      })
      .catch((err) => toast(errorText(err), true));
  }

  function clearSearch() {
    if (tab === 'all') load('all');
    else setTab('all');
  }

  async function join(g) {
    try {
      const res = await api.post('/api/groups/' + g._id + '/join');
      toast(res.pending ? 'Request sent to the group manager' : 'You joined the group');
      load(tab);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function leave(g) {
    try {
      await api.post('/api/groups/' + g._id + '/leave');
      toast('You left the group');
      load(tab);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function remove(g) {
    if (!window.confirm('Delete this group? Its events will be removed too.')) return;
    try {
      await api.del('/api/groups/' + g._id);
      toast('Group deleted');
      setGroups((list) => list.filter((x) => x._id !== g._id));
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="glow">Groups</h1>
          <p className="muted">Communities built around a brand, a scene or a style.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setFormOpen(!formOpen)}>Start a group</button>
      </div>

      {formOpen && (
        <GroupForm categories={categories}
                   onSaved={(group) => { window.location.href = '/groups/' + group._id; }}
                   onCancel={() => setFormOpen(false)} />
      )}

      <GroupFilters categories={categories} onSearch={search} onClear={clearSearch} />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <GroupList groups={groups} emptyText={emptyText} onJoin={join} onLeave={leave} onDelete={remove} />
    </>
  );
}
