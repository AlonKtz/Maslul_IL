import React, { useState } from 'react';
import { toast } from '../../lib/toast';
import StatTiles from './StatTiles';
import EventsPerMonthChart from './EventsPerMonthChart';
import CarsByMakeChart from './CarsByMakeChart';
import ListingsChart from './ListingsChart';
import GroupActivityChart from './GroupActivityChart';
import CitiesChart from './CitiesChart';

/*
  The statistics page: the totals and five D3 charts, each its own
  component. Every number is worked out by the server from the database
  when it is asked for, so nothing is typed in. Refresh asks again.
*/
export default function StatsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((n) => n + 1);
    toast('Charts refreshed from the database');
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="glow">Statistics</h1>
          <p className="muted">Everything on this page is calculated from the database as it is right now.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={refresh}>Refresh</button>
      </div>

      <StatTiles refreshKey={refreshKey} />
      <EventsPerMonthChart refreshKey={refreshKey} />
      <CarsByMakeChart refreshKey={refreshKey} />
      <ListingsChart refreshKey={refreshKey} />
      <GroupActivityChart refreshKey={refreshKey} />
      <CitiesChart refreshKey={refreshKey} />
    </>
  );
}
