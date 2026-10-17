import React, { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import Tabs from '../common/Tabs';
import EventForm from './EventForm';
import EventFilters from './EventFilters';
import EventList from './EventList';

/*
  Meets and races: host one (EventForm), filter them (EventFilters), and
  three tabs: everything coming up, the ones I host, and the ones I said I
  would go to. cities, raceTypes and circuits come from the server so the
  dropdowns only ever offer values the model accepts.
*/
const TABS = [
  { id: 'all', label: 'All upcoming' },
  { id: 'mine', label: 'Hosting' },
  { id: 'going', label: 'Going' },
];

const EMPTY_TEXT = {
  all: 'No upcoming events yet. Be the first to host one.',
  mine: 'You are not hosting anything yet.',
  going: 'You have not marked yourself as going to anything.',
};

const PARAMS = { all: {}, mine: { mine: 'true' }, going: { attending: 'true' } };

export default function EventsPage({ cities, raceTypes, circuits }) {
  const [tab, setTab] = useState('all');
  const [events, setEvents] = useState(null);
  const [emptyText, setEmptyText] = useState(EMPTY_TEXT.all);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback((which) => {
    setEvents(null);
    setEmptyText(EMPTY_TEXT[which]);
    api.get('/api/events', PARAMS[which])
      .then((res) => setEvents(res.events))
      .catch((err) => { setEvents([]); setEmptyText(errorText(err)); });
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  function search(params) {
    setEvents(null);
    api.get('/api/events/search', params)
      .then((res) => {
        // show the results on the "All upcoming" tab, or it looks like nothing happened
        setTab('all');
        setEvents(res.events);
        setEmptyText('Nothing matched those filters.');
        toast(res.total + ' event' + (res.total === 1 ? '' : 's') + ' found');
      })
      .catch((err) => toast(errorText(err), true));
  }

  function clearSearch() {
    if (tab === 'all') load('all');
    else setTab('all');
  }

  function edit(ev) {
    setEditing(ev);
    setFormOpen(true);
  }

  async function remove(ev) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.del('/api/events/' + ev._id);
      toast('Event deleted');
      setEvents((list) => list.filter((e) => e._id !== ev._id));
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function attend(ev) {
    try {
      const res = await api.post('/api/events/' + ev._id + '/attend');
      toast(res.attending ? 'You are going' : 'You are no longer going');
      if (tab === 'going') load('going');
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="glow">Meets &amp; races</h1>
          <p className="muted">Find a gathering near you, or host your own.</p>
        </div>
        <button className="btn btn-primary" type="button"
                onClick={() => { setEditing(null); setFormOpen(!formOpen); }}>
          Host an event
        </button>
      </div>

      {formOpen && (
        <EventForm event={editing} cities={cities} raceTypes={raceTypes} circuits={circuits}
                   onSaved={() => { closeForm(); load(tab); }} onCancel={closeForm} />
      )}

      <EventFilters cities={cities} raceTypes={raceTypes} onSearch={search} onClear={clearSearch} />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <EventList events={events} emptyText={emptyText} onEdit={edit} onDelete={remove} onAttend={attend} />
    </>
  );
}
