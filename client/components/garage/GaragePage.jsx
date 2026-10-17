import React, { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import Tabs from '../common/Tabs';
import Showroom from './Showroom';
import CarForm from './CarForm';
import CarList from './CarList';
import CarSearch from './CarSearch';

/*
  The garage: the showroom with my strongest car, the add / edit form, my
  own cars, and a tab that searches everybody else's. categories (the body
  types) come from the server through the page.
*/
const TABS = [
  { id: 'mine', label: 'My garage' },
  { id: 'browse', label: 'Browse all cars' },
];

export default function GaragePage({ categories }) {
  const [tab, setTab] = useState('mine');
  const [myCars, setMyCars] = useState(null);
  const [allCars, setAllCars] = useState(null);
  const [allEmpty, setAllEmpty] = useState('No cars have been added yet.');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadMine = useCallback(() => {
    api.get('/api/cars', { mine: 'true' })
      .then((res) => setMyCars(res.cars))
      .catch((err) => {
        setMyCars([]);
        toast(errorText(err), true);
      });
  }, []);

  const loadAll = useCallback(() => {
    setAllCars(null);
    setAllEmpty('No cars have been added yet.');
    api.get('/api/cars')
      .then((res) => setAllCars(res.cars))
      .catch((err) => {
        setAllCars([]);
        toast(errorText(err), true);
      });
  }, []);

  useEffect(loadMine, [loadMine]);

  // the browse tab loads the first time it is opened
  useEffect(() => {
    if (tab === 'browse' && allCars === null) loadAll();
  }, [tab, allCars, loadAll]);

  function search(params) {
    setAllCars(null);
    api.get('/api/cars/search', params)
      .then((res) => {
        setAllCars(res.cars);
        setAllEmpty('No car matched those filters.');
        toast(res.total + ' car' + (res.total === 1 ? '' : 's') + ' found');
      })
      .catch((err) => toast(errorText(err), true));
  }

  function edit(car) {
    setEditing(car);
    setFormOpen(true);
  }

  async function remove(car) {
    if (!window.confirm('Remove this car from your garage?')) return;
    try {
      await api.del('/api/cars/' + car._id);
      toast('Car removed');
      loadMine();
      if (allCars) setAllCars(allCars.filter((c) => c._id !== car._id));
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
          <h1 className="glow">Garage</h1>
          <p className="muted">Your cars, and everyone else's.</p>
        </div>
        <button className="btn btn-primary" type="button"
                onClick={() => { setEditing(null); setFormOpen(!formOpen); }}>
          Add a car
        </button>
      </div>

      <Showroom cars={myCars} />

      {formOpen && (
        <CarForm car={editing} categories={categories}
                 onSaved={() => { closeForm(); loadMine(); }}
                 onCancel={closeForm} />
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'mine' ? (
        <CarList cars={myCars} emptyText="Your garage is empty. Add your first car."
                 onEdit={edit} onDelete={remove} />
      ) : (
        <>
          <CarSearch categories={categories} onSearch={search} onClear={loadAll} />
          <CarList cars={allCars} emptyText={allEmpty} onEdit={edit} onDelete={remove} />
        </>
      )}
    </>
  );
}
