// gives a real photo to events and groups that are still on the grey default
// picture. runs once when the server starts, so a database that was seeded
// before the photos existed (like the hosted one) picks them up without being
// wiped. anything with a photo of its own is never touched.

const Event = require('../models/Event');
const Group = require('../models/Group');

const EVENT_DEFAULT = '/img/default-event.svg';
const GROUP_DEFAULT = '/img/default-cover.svg';

const EVENT_BY_TITLE = {
  'Friday night cruise': 'friday-night-cruise',
  'Haifa port meet': 'car-meet',
  'Cars and coffee': 'car-meet',
  'Classic breakfast run': 'car-meet',
  'Supercar breakfast meet': 'car-meet',
  'Negev desert run': 'sunday-drive',
  'Negev scenic run': 'sunday-drive',
  'Sunday canyon drive': 'sunday-drive',
  'EV road trip north': 'sunday-drive',
  'Drift practice': 'drift-race',
  'Hill climb': 'hill-climb',
  'Rally sprint': 'rally-sprint',
};

// for events members made themselves, go by the race format
const EVENT_BY_RACE_TYPE = {
  Drift: 'drift-race',
  Hillclimb: 'hill-climb',
  Rally: 'rally-sprint',
};

const GROUP_BY_NAME = {
  'BMW Israel': '/img/cars/bmw-m3-cs-2023.jpg',
  'JDM Israel': '/img/cars/nissan-r34.jpg',
  'Negev Off-road': '/img/cars/defender-90.jpg',
  'Classic Cars IL': '/img/cars/vw-beetle.jpg',
  'EV Drivers IL': '/img/cars/tesla-model-3.jpg',
  'Drift Collective': '/img/events/drift-race.jpg',
  'Tuning Garage': '/img/cars/ford-focus-rs.jpg',
};

function eventPhoto(ev) {
  const name = EVENT_BY_TITLE[ev.title]
    || EVENT_BY_RACE_TYPE[ev.raceType]
    || (ev.type === 'race' ? 'track-day' : 'car-meet');
  return '/img/events/' + name + '.jpg';
}

async function applyDefaultPhotos() {
  try {
    const events = await Event.find({ coverImage: { $in: [EVENT_DEFAULT, null, ''] } });
    for (const ev of events) {
      await Event.updateOne({ _id: ev._id }, { coverImage: eventPhoto(ev) });
    }

    const groups = await Group.find({
      coverImage: { $in: [GROUP_DEFAULT, null, ''] },
      name: { $in: Object.keys(GROUP_BY_NAME) },
    });
    for (const g of groups) {
      await Group.updateOne({ _id: g._id }, { coverImage: GROUP_BY_NAME[g.name] });
    }

    if (events.length || groups.length) {
      console.log(`[photos] gave covers to ${events.length} events and ${groups.length} groups`);
    }
  } catch (err) {
    // not worth stopping the server over
    console.error('[photos] could not apply default photos', err.message);
  }
}

module.exports = applyDefaultPhotos;
