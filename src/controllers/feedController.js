const Event = require('../models/Event');
const Listing = require('../models/Listing');
const Group = require('../models/Group');
const User = require('../models/User');
const { paginate } = require('../utils/query');

/**
 * Feed controller.
 *
 * The feed is what the member actually cares about rather than everything on
 * the site: things their friends posted, and things happening in the groups
 * they belong to — plus their own.
 *
 * Events and listings are fetched separately and then merged into one list
 * ordered by when they were posted, so the page reads as a single timeline.
 */

// GET /feed — page shell; the timeline arrives over Ajax.
function showFeed(req, res) {
  res.render('pages/feed', { title: 'Feed' });
}

// Works out whose content belongs in this member's feed.
async function circleOf(user) {
  const groups = await Group.find({ members: user._id }).select('_id');

  return {
    groupIds: groups.map((g) => g._id),
    // Me and my friends.
    peopleIds: [user._id, ...user.friends],
  };
}

// GET /api/feed
// ?filter=all      everything in my circle (default)
// ?filter=friends  only what my friends posted
// ?filter=groups   only what is happening in my groups
async function feed(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query, 12, 40);
    const me = req.currentUser;
    const { groupIds, peopleIds } = await circleOf(me);
    const filter = req.query.filter || 'all';

    // Which events count: hosted by me or a friend, or held by one of my groups.
    const eventOr = [];
    if (filter === 'all' || filter === 'friends') eventOr.push({ host: { $in: peopleIds } });
    if (filter === 'all' || filter === 'groups') eventOr.push({ group: { $in: groupIds } });

    // Listings have no group, so they only appear for me and my friends.
    const listingMatch = filter === 'groups' ? null : { seller: { $in: peopleIds } };

    const [events, listings] = await Promise.all([
      eventOr.length
        ? Event.find({ $or: eventOr })
            .populate('host', 'username displayName avatar')
            .populate('group', 'name')
            .sort({ createdAt: -1 })
            .limit(skip + limit)
        : [],
      listingMatch
        ? Listing.find(Object.assign({ status: 'available' }, listingMatch))
            .populate('seller', 'username displayName avatar')
            .sort({ createdAt: -1 })
            .limit(skip + limit)
        : [],
    ]);

    // Merge the two kinds into one timeline.
    const items = events
      .map((e) => ({ kind: 'event', createdAt: e.createdAt, data: e }))
      .concat(listings.map((l) => ({ kind: 'listing', createdAt: l.createdAt, data: l })))
      .sort((a, b) => b.createdAt - a.createdAt);

    const pageItems = items.slice(skip, skip + limit);

    res.json({
      items: pageItems,
      total: items.length,
      page,
      hasMore: items.length > skip + limit,
      // Shown on the page so an empty feed can explain itself.
      circle: { friends: me.friends.length, groups: groupIds.length },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/feed/suggestions — a few members to befriend.
// Anyone who is not already a friend and is not the member themselves.
async function suggestions(req, res, next) {
  try {
    const me = req.currentUser;

    const people = await User.find({
      _id: { $nin: [me._id, ...me.friends] },
      friendRequests: { $ne: me._id },   // do not suggest people we already asked
    })
      .select('username displayName avatar location')
      .limit(5);

    const myGroups = await Group.find({ members: me._id }).select('name');

    res.json({ suggestions: people, groups: myGroups });
  } catch (err) {
    next(err);
  }
}

module.exports = { showFeed, feed, suggestions };
