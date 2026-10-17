const Event = require('../models/Event');
const Listing = require('../models/Listing');
const Car = require('../models/Car');
const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');

/*
  All the numbers behind the statistics page.

  Every one of these is a mongo aggregation running over the real collections.
  Nothing here is typed in by hand. That was the point of the requirement, the
  graphs have to come from the database. If you add a car and reload the page
  the bars change.
*/

// GET /stats. renders the empty page, the numbers come after over ajax
function showStats(req, res) {
  res.render('pages/stats', { title: 'Statistics' });
}

// GET /api/stats/summary, the big counters along the top
async function summary(req, res, next) {
  try {
    const [members, groups, events, listings, cars, messages] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Event.countDocuments(),
      Listing.countDocuments(),
      Car.countDocuments(),
      Message.countDocuments(),
    ]);

    res.json({ members, groups, events, listings, cars, messages });
  } catch (err) {
    next(err);
  }
}

// GET /api/stats/events-per-month
// how many meets and races happen each month. this is my version of the
// "average posts per month" example the brief gives.
async function eventsPerMonth(req, res, next) {
  try {
    const rows = await Event.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$startsAt' },
            month: { $month: '$startsAt' },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // mongo gives me one row per month per type. the chart wants one row per
    // month with both numbers on it, so reshape it here.
    const byMonth = new Map();

    rows.forEach((row) => {
      const key = row._id.year + '-' + String(row._id.month).padStart(2, '0');
      if (!byMonth.has(key)) byMonth.set(key, { month: key, meet: 0, race: 0 });
      byMonth.get(key)[row._id.type] = row.count;
    });

    const data = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// GET /api/stats/cars-by-make, the ten most common makes across all garages
async function carsByMake(req, res, next) {
  try {
    const data = await Car.aggregate([
      {
        $group: {
          // upper case the make first, otherwise "bmw" and "BMW" get counted separately
          _id: { $toUpper: '$make' },
          count: { $sum: 1 },
          averageHorsepower: { $avg: '$horsepower' },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          make: '$_id',
          count: 1,
          averageHorsepower: { $round: [{ $ifNull: ['$averageHorsepower', 0] }, 0] },
        },
      },
    ]);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// GET /api/stats/listings-by-category, item counts plus the average price
async function listingsByCategory(req, res, next) {
  try {
    const data = await Listing.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          averagePrice: { $round: [{ $ifNull: ['$averagePrice', 0] }, 0] },
        },
      },
    ]);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// GET /api/stats/events-by-city, which cities things actually happen in
async function eventsByCity(req, res, next) {
  try {
    const data = await Event.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          attendees: { $sum: { $size: '$attendees' } },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 },
      { $project: { _id: 0, city: '$_id', count: 1, attendees: 1 } },
    ]);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// GET /api/stats/group-activity
// roughly how many events each group puts on per month.
async function groupActivity(req, res, next) {
  try {
    const data = await Group.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'group',
          as: 'events',
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          members: { $size: '$members' },
          events: { $size: '$events' },
          // how many months the group has existed. never less than 1 or I divide by zero
          monthsActive: {
            $max: [
              1,
              {
                $ceil: {
                  $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24 * 30],
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          eventsPerMonth: { $round: [{ $divide: ['$events', '$monthsActive'] }, 2] },
        },
      },
      { $sort: { members: -1 } },
      { $limit: 10 },
    ]);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showStats,
  summary,
  eventsPerMonth,
  carsByMake,
  listingsByCategory,
  eventsByCity,
  groupActivity,
};
