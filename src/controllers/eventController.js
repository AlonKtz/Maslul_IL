const Event = require('../models/Event');
const Group = require('../models/Group');
const { CITIES, coordinatesOf } = require('../data/cities');
const { contains, paginate, num, date } = require('../utils/query');

/*
  Everything to do with events, which means both car meets and races.

  Full create, update, delete, list and search, plus saying you are going,
  likes and comments.

  The rule is that only the person hosting the event can change or delete it.
  Site admins can too.
*/

/*
  Works out which private groups this member is not allowed to look into.

  I had this on the old Post model and lost it when I split posts into events
  and listings. My own test caught it: somebody who was not in a private group
  could still read its events by asking the api directly, even though the group
  page itself blocked them. The page being blocked is not enough, the api has
  to block it too.
*/
async function hiddenGroupIds(user) {
  const privateGroups = await Group.find({ isPrivate: true }).select('_id members admin');

  return privateGroups
    .filter((g) => {
      if (user.role === 'admin') return false;          // site admins see everything
      if (g.admin.equals(user._id)) return false;       // the manager is obviously in
      return !g.members.some((m) => m.equals(user._id));
    })
    .map((g) => g._id);
}

// Adds the private group rule to a filter that is about to be run.
// Returns false when the member asked for one specific group they cannot see,
// so the caller can answer 403 instead of quietly returning nothing.
function applyPrivacy(filter, hidden, requestedGroup) {
  if (requestedGroup) {
    if (hidden.some((id) => id.equals(requestedGroup))) return false;
    return true;
  }
  if (hidden.length) filter.group = { $nin: hidden };
  return true;
}

// GET /events. renders the empty page, the events load after over ajax
function showEvents(req, res) {
  res.render('pages/events', {
    title: 'Meets & races',
    cities: CITIES.map((c) => c.name),
    raceTypes: Event.RACE_TYPES,
    // optional. if you put a youtube id in .env it shows up as the weekly recap
    youtubeId: process.env.RECAP_YOUTUBE_ID || '',
  });
}

// GET /events/:id, one event on its own page
async function showEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('host', 'username displayName avatar')
      .populate('group', 'name')
      .populate('attendees', 'username displayName avatar')
      .populate('comments.author', 'username displayName avatar');

    if (!event) {
      return res.status(404).render('pages/error', {
        title: 'Event not found',
        message: 'That meet or race does not exist.',
      });
    }

    res.render('pages/event', {
      title: event.title,
      event,
      isHost: event.host._id.equals(req.currentUser._id),
      isAttending: event.attendees.some((a) => a._id.equals(req.currentUser._id)),
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIST
// GET /api/events                 -> upcoming events
// GET /api/events?mine=true       -> events I host
// GET /api/events?attending=true  -> events I am going to
// GET /api/events?past=true       -> events that already happened
async function list(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.query.mine === 'true') filter.host = req.currentUser._id;
    if (req.query.attending === 'true') filter.attendees = req.currentUser._id;
    if (req.query.group) filter.group = req.query.group;
    if (req.query.type && Event.EVENT_TYPES.includes(req.query.type)) filter.type = req.query.type;

    // keep private groups out unless this member belongs to them
    const hidden = await hiddenGroupIds(req.currentUser);
    if (!applyPrivacy(filter, hidden, req.query.group)) {
      return res.status(403).json({ error: 'This group is private.' });
    }

    // unless you ask for past ones, only show events that are still coming up
    filter.startsAt = req.query.past === 'true' ? { $lt: new Date() } : { $gte: new Date() };

    const sort = req.query.past === 'true' ? { startsAt: -1 } : { startsAt: 1 };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('host', 'username displayName avatar')
        .populate('group', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- SEARCH
// GET /api/events/search
// takes keyword, type, race format, city and a date range
async function search(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { keyword, type, raceType, city, dateFrom, dateTo, includePast } = req.query;
    const filter = {};

    if (keyword && keyword.trim()) {
      filter.$or = [{ title: contains(keyword) }, { description: contains(keyword) }];
    }
    if (type && Event.EVENT_TYPES.includes(type)) filter.type = type;
    if (raceType && Event.RACE_TYPES.includes(raceType)) filter.raceType = raceType;
    if (city && coordinatesOf(city)) filter.city = city;

    const from = date(dateFrom);
    const to = date(dateTo);
    if (from || to) {
      filter.startsAt = {};
      if (from) filter.startsAt.$gte = from;
      if (to) filter.startsAt.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else if (includePast !== 'true') {
      filter.startsAt = { $gte: new Date() };
    }

    // the search has to respect private groups just like the list does
    const hidden = await hiddenGroupIds(req.currentUser);
    if (!applyPrivacy(filter, hidden, req.query.group)) {
      return res.status(403).json({ error: 'This group is private.' });
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('host', 'username displayName avatar')
        .populate('group', 'name')
        .sort({ startsAt: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- AREA SEARCH
// POST /api/events/area
// the body has the polygon, which is a list of [lng, lat] points.
//
// those points are the shape the user drew on the canvas map. I hand the
// shape to mongo and $geoWithin gives me back every event that sits inside
// it. this is the part I am most happy with.
async function searchArea(req, res, next) {
  try {
    const { polygon, type, dateFrom, dateTo, includePast } = req.body;

    if (!Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ error: 'Draw an area with at least three points.' });
    }

    // check every point before using it. the browser can send me anything
    const clean = polygon.map((p) => {
      if (!Array.isArray(p) || p.length !== 2) throw Object.assign(new Error('Bad point'), { status: 400, expose: true });
      const lng = Number(p[0]);
      const lat = Number(p[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw Object.assign(new Error('Point is outside the world'), { status: 400, expose: true });
      }
      return [lng, lat];
    });

    // geojson wants the shape closed, so the last point has to repeat the first one
    const first = clean[0];
    const last = clean[clean.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) clean.push([first[0], first[1]]);

    const filter = {
      location: {
        $geoWithin: { $geometry: { type: 'Polygon', coordinates: [clean] } },
      },
    };

    if (type && Event.EVENT_TYPES.includes(type)) filter.type = type;

    const from = date(dateFrom);
    const to = date(dateTo);
    if (from || to) {
      filter.startsAt = {};
      if (from) filter.startsAt.$gte = from;
      if (to) filter.startsAt.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else if (includePast !== true && includePast !== 'true') {
      filter.startsAt = { $gte: new Date() };
    }

    // and so does the map search, otherwise drawing a box over the right city
    // would quietly reveal a private group's events
    const hidden = await hiddenGroupIds(req.currentUser);
    if (hidden.length) filter.group = { $nin: hidden };

    const events = await Event.find(filter)
      .populate('host', 'username displayName avatar')
      .sort({ startsAt: 1 })
      .limit(100);

    res.json({ events, total: events.length });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- CREATE
// POST /api/events
async function create(req, res, next) {
  try {
    const { title, description, type, raceType, city, address, startsAt, group, maxAttendees, coverImage } = req.body;

    const coordinates = coordinatesOf(city);
    if (!coordinates) return res.status(400).json({ error: 'Pick a city from the list.' });

    // Hosting an event on behalf of a group requires membership of it.
    if (group) {
      const target = await Group.findById(group);
      if (!target) return res.status(404).json({ error: 'Group not found.' });
      const isMember = target.members.some((m) => m.equals(req.currentUser._id));
      const isManager = target.admin.equals(req.currentUser._id);
      if (!isMember && !isManager) {
        return res.status(403).json({ error: 'Join the group before hosting an event for it.' });
      }
    }

    const event = await Event.create({
      title,
      description,
      type,
      raceType: type === 'race' ? raceType || '' : '',
      host: req.currentUser._id,
      group: group || null,
      city,
      address,
      startsAt,
      location: { type: 'Point', coordinates },
      maxAttendees: maxAttendees || 0,
      coverImage: coverImage || undefined,
      attendees: [req.currentUser._id], // the host is going, obviously
    });

    await event.populate('host', 'username displayName avatar');
    res.status(201).json({ ok: true, event });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- UPDATE
// PUT /api/events/:id, only the host can do this
async function update(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (!event.host.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only the host can edit this event.' });
    }

    ['title', 'description', 'type', 'raceType', 'address', 'startsAt', 'maxAttendees', 'coverImage'].forEach((f) => {
      if (req.body[f] !== undefined) event[f] = req.body[f];
    });

    // if the city changed then the map coordinates have to change with it
    if (req.body.city !== undefined) {
      const coordinates = coordinatesOf(req.body.city);
      if (!coordinates) return res.status(400).json({ error: 'Pick a city from the list.' });
      event.city = req.body.city;
      event.location = { type: 'Point', coordinates };
    }

    if (event.type !== 'race') event.raceType = '';

    await event.save();
    await event.populate('host', 'username displayName avatar');
    res.json({ ok: true, event });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- DELETE
// DELETE /api/events/:id, only the host can do this
async function remove(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (!event.host.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only the host can delete this event.' });
    }

    await event.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- RSVP
// POST /api/events/:id/attend. press once to go, press again to cancel
async function toggleAttend(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (event.host.equals(req.currentUser._id)) {
      return res.status(400).json({ error: 'The host is always attending.' });
    }

    const index = event.attendees.findIndex((a) => a.equals(req.currentUser._id));

    if (index === -1) {
      if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
        return res.status(409).json({ error: 'This event is full.' });
      }
      event.attendees.push(req.currentUser._id);
    } else {
      event.attendees.splice(index, 1);
    }

    await event.save();
    res.json({ ok: true, attending: index === -1, count: event.attendees.length });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIKE / COMMENT
async function toggleLike(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const index = event.likes.findIndex((id) => id.equals(req.currentUser._id));
    if (index === -1) event.likes.push(req.currentUser._id);
    else event.likes.splice(index, 1);

    await event.save();
    res.json({ ok: true, likes: event.likes.length, liked: index === -1 });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    event.comments.push({ author: req.currentUser._id, text: req.body.text });
    await event.save();
    await event.populate('comments.author', 'username displayName avatar');

    res.status(201).json({ ok: true, comments: event.comments });
  } catch (err) {
    next(err);
  }
}

async function removeComment(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const comment = event.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const allowed =
      comment.author.equals(req.currentUser._id) ||
      event.host.equals(req.currentUser._id) ||
      req.currentUser.role === 'admin';
    if (!allowed) return res.status(403).json({ error: 'You cannot delete this comment.' });

    comment.deleteOne();
    await event.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showEvents,
  showEvent,
  list,
  search,
  searchArea,
  create,
  update,
  remove,
  toggleAttend,
  toggleLike,
  addComment,
  removeComment,
};
