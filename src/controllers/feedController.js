const Event = require('../models/Event');
const Listing = require('../models/Listing');
const Group = require('../models/Group');
const User = require('../models/User');
const { paginate } = require('../utils/query');

/*
  The feed page.

  The idea is to show what you actually care about instead of everything on
  the site. So that means your friends' stuff, whatever is happening in the
  groups you joined, and your own.

  Events and listings are two different collections, so I fetch them
  separately and then merge them into one list sorted by date. That way the
  page reads like a single timeline instead of two lists.
*/

// GET /feed. renders the page, the timeline loads after over ajax
function showFeed(req, res) {
  res.render('pages/feed', { title: 'Feed' });
}

// works out whose stuff should show up in my feed
async function circleOf(user) {
  const groups = await Group.find({ members: user._id }).select('_id');

  return {
    groupIds: groups.map((g) => g._id),
    // me plus everyone I am friends with
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

    // an event belongs in the feed if a friend is hosting it, or if it belongs to
    // one of my groups
    const eventOr = [];
    if (filter === 'all' || filter === 'friends') eventOr.push({ host: { $in: peopleIds } });
    if (filter === 'all' || filter === 'groups') eventOr.push({ group: { $in: groupIds } });

    // listings do not belong to a group, so they only come from people
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

    // put the events and the listings together and sort the lot by date
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
      // the page uses this to explain why the feed is empty for a brand new user
      circle: { friends: me.friends.length, groups: groupIds.length },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/feed/suggestions, a few people to add as friends.
// anyone who is not me, not already a friend, and who I have not asked yet.
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
