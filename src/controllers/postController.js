const Post = require('../models/Post');
const Group = require('../models/Group');
const { contains, paginate, date } = require('../utils/query');

/**
 * Post controller — feed content.
 * Full Create / Update / Delete / List / Search, plus likes and comments.
 *
 * Visibility rule: posts that belong to a private group are only readable by
 * that group's members (and its manager / site administrators).
 * Editing rule: only the author may edit a post; the author, the group
 * manager or a site administrator may delete it.
 */

// Returns the ids of the private groups the user may NOT read.
// Used to filter private content out of lists and searches.
async function hiddenGroupIds(user) {
  const privateGroups = await Group.find({ isPrivate: true }).select('_id members admin');
  return privateGroups
    .filter((g) => {
      if (!user) return true;
      if (user.role === 'admin') return false;
      if (g.admin.equals(user._id)) return false;
      return !g.members.some((m) => m.equals(user._id));
    })
    .map((g) => g._id);
}

// GET /feed — page shell; posts arrive over Ajax.
function showFeed(req, res) {
  res.render('pages/feed', { title: 'Feed' });
}

// ---------------------------------------------------------------- LIST / FEED
// GET /api/posts                -> personalised feed (groups + friends + own)
// GET /api/posts?scope=all      -> everything the user is allowed to see
// GET /api/posts?author=<id>    -> a single member's posts
// GET /api/posts?group=<id>     -> a single group's posts
async function list(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const me = req.currentUser;
    const hidden = await hiddenGroupIds(me);

    let filter = {};

    if (req.query.author) {
      filter.author = req.query.author;
    } else if (req.query.group) {
      filter.group = req.query.group;
    } else if (req.query.scope !== 'all') {
      // The personalised feed: my own posts, my friends' posts, and posts
      // in the groups I belong to.
      const myGroups = await Group.find({ members: me._id }).select('_id');
      filter = {
        $or: [
          { author: me._id },
          { author: { $in: me.friends } },
          { group: { $in: myGroups.map((g) => g._id) } },
        ],
      };
    }

    // Never show posts from private groups the viewer is not part of.
    if (req.query.group) {
      // A specific group was asked for: refuse outright if it is hidden.
      if (hidden.some((id) => id.equals(req.query.group))) {
        return res.status(403).json({ error: 'This group is private.' });
      }
    } else if (hidden.length) {
      // Otherwise filter hidden groups out of the results.
      // Posts with no group (group: null) still match, which is what we want.
      filter.group = { $nin: hidden };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username displayName avatar')
        .populate('group', 'name isPrivate')
        .populate('comments.author', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- SEARCH
// GET /api/posts/search
// Advanced multi-parameter search (requirement: at least three parameters).
// Accepts: keyword, group, author, dateFrom, dateTo, hasImage.
async function search(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { keyword, group, author, dateFrom, dateTo, hasImage } = req.query;
    const filter = {};

    if (keyword && keyword.trim()) filter.text = contains(keyword);
    if (group) filter.group = group;
    if (author) filter.author = author;
    if (hasImage === 'true') filter.image = { $ne: '' };

    const from = date(dateFrom);
    const to = date(dateTo);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      // Include the whole "to" day.
      if (to) filter.createdAt.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
    }

    // Respect private-group visibility.
    const hidden = await hiddenGroupIds(req.currentUser);
    if (hidden.length && !filter.group) filter.group = { $nin: hidden };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username displayName avatar')
        .populate('group', 'name isPrivate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- CREATE
// POST /api/posts
async function create(req, res, next) {
  try {
    const { text, group, image } = req.body;

    // Posting into a group requires membership.
    if (group) {
      const target = await Group.findById(group);
      if (!target) return res.status(404).json({ error: 'Group not found.' });

      const isMember = target.members.some((m) => m.equals(req.currentUser._id));
      const isManager = target.admin.equals(req.currentUser._id);
      if (!isMember && !isManager && req.currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Join the group before posting in it.' });
      }
    }

    const post = await Post.create({
      author: req.currentUser._id,
      group: group || null,
      text,
      image: image || '',
    });

    await post.populate('author', 'username displayName avatar');
    await post.populate('group', 'name isPrivate');
    res.status(201).json({ ok: true, post });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- UPDATE
// PUT /api/posts/:id — only the author may edit their own post.
async function update(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    if (!post.author.equals(req.currentUser._id)) {
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }

    if (req.body.text !== undefined) post.text = req.body.text;
    if (req.body.image !== undefined) post.image = req.body.image;

    await post.save();
    await post.populate('author', 'username displayName avatar');
    res.json({ ok: true, post });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- DELETE
// DELETE /api/posts/:id — author, group manager or site administrator.
async function remove(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    let allowed = post.author.equals(req.currentUser._id) || req.currentUser.role === 'admin';

    if (!allowed && post.group) {
      const group = await Group.findById(post.group);
      if (group && group.admin.equals(req.currentUser._id)) allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'You cannot delete this post.' });
    }

    await post.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIKE
// POST /api/posts/:id/like — toggles the like of the current user.
async function toggleLike(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const index = post.likes.findIndex((id) => id.equals(req.currentUser._id));
    if (index === -1) post.likes.push(req.currentUser._id);
    else post.likes.splice(index, 1);

    await post.save();
    res.json({ ok: true, likes: post.likes.length, liked: index === -1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- COMMENT
// POST /api/posts/:id/comments
async function addComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    post.comments.push({ author: req.currentUser._id, text: req.body.text });
    await post.save();
    await post.populate('comments.author', 'username displayName avatar');

    res.status(201).json({ ok: true, comments: post.comments });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id/comments/:commentId — comment author or post author.
async function removeComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const allowed =
      comment.author.equals(req.currentUser._id) ||
      post.author.equals(req.currentUser._id) ||
      req.currentUser.role === 'admin';

    if (!allowed) return res.status(403).json({ error: 'You cannot delete this comment.' });

    comment.deleteOne();
    await post.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showFeed,
  list,
  search,
  create,
  update,
  remove,
  toggleLike,
  addComment,
  removeComment,
};
