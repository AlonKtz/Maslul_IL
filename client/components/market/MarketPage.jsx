import React, { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import Tabs from '../common/Tabs';
import ListingForm from './ListingForm';
import MarketFilters from './MarketFilters';
import ListingList from './ListingList';

/*
  The marketplace: sell something (ListingForm), filter (MarketFilters), and
  two tabs, everything for sale and my own listings. categories, conditions
  and cities come from the server so the dropdowns match the model.
*/
const TABS = [
  { id: 'all', label: 'Everything for sale' },
  { id: 'mine', label: 'My listings' },
];
const EMPTY_TEXT = { all: 'Nothing is for sale yet.', mine: 'You have not listed anything yet.' };

export default function MarketPage({ categories, conditions, cities }) {
  const [tab, setTab] = useState('all');
  const [listings, setListings] = useState(null);
  const [emptyText, setEmptyText] = useState(EMPTY_TEXT.all);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback((which) => {
    setListings(null);
    setEmptyText(EMPTY_TEXT[which]);
    api.get('/api/listings', which === 'mine' ? { mine: 'true' } : {})
      .then((res) => setListings(res.listings))
      .catch((err) => { setListings([]); setEmptyText(errorText(err)); });
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  function search(params) {
    setListings(null);
    api.get('/api/listings/search', params)
      .then((res) => {
        setTab('all');
        setListings(res.listings);
        setEmptyText('Nothing matched those filters.');
        toast(res.total + ' item' + (res.total === 1 ? '' : 's') + ' found');
      })
      .catch((err) => toast(errorText(err), true));
  }

  function clearSearch() {
    if (tab === 'all') load('all');
    else setTab('all');
  }

  async function toggleSold(li) {
    try {
      const res = await api.post('/api/listings/' + li._id + '/sold');
      toast(res.status === 'sold' ? 'Marked as sold' : 'Back on sale');
      load(tab);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  async function remove(li) {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.del('/api/listings/' + li._id);
      toast('Listing deleted');
      setListings((list) => list.filter((x) => x._id !== li._id));
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
          <h1 className="glow">Marketplace</h1>
          <p className="muted">Buy and sell cars, parts and gear, close to home.</p>
        </div>
        <button className="btn btn-primary" type="button"
                onClick={() => { setEditing(null); setFormOpen(!formOpen); }}>
          Sell something
        </button>
      </div>

      {formOpen && (
        <ListingForm listing={editing} categories={categories} conditions={conditions} cities={cities}
                     onSaved={() => { closeForm(); load(tab); }} onCancel={closeForm} />
      )}

      <MarketFilters categories={categories} conditions={conditions} cities={cities}
                     onSearch={search} onClear={clearSearch} />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <ListingList listings={listings} emptyText={emptyText}
                   onEdit={(li) => { setEditing(li); setFormOpen(true); }}
                   onToggleSold={toggleSold} onDelete={remove} />
    </>
  );
}
