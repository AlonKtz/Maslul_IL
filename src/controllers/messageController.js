const Message = require('../models/Message');
const User = require('../models/User');
const { contains, paginate } = require('../utils/query');

/*
  The normal http side of the chat.

  Sending messages live is done by the socket, over in src/socket/chat.js.
  What is here is the conversation list, loading old messages, searching them,
  and editing or deleting one. Together with the socket that gives the Message
  model the same create, update, delete, list and search as everything else.

  The privacy rule is simple. Every query is limited to messages you sent or
  received, so you can never read anyone else's chat.
*/

// GET /chat, renders the page
async function showChat(req, res, next) {
  try {
    // the people you can start a chat with, which is your friends
    const me = await User.findById(req.currentUser._id)
      .populate('friends', 'username displayName avatar');

    res.render('pages/chat', {
      title: 'Chat',
      friends: me.friends,
      openWith: req.query.to || '',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/messages/conversations
// one row per person you have talked to, showing the newest message
async function conversations(req, res, next) {
  try {
    const meId = req.currentUser._id;

    const messages = await Message.find({ $or: [{ from: meId }, { to: meId }] })
      .sort({ createdAt: -1 })
      .populate('from', 'username displayName avatar')
      .populate('to', 'username displayName avatar')
      .limit(300);

    // group the messages by the other person and keep only the newest one
    const byPerson = new Map();

    messages.forEach((msg) => {
      const other = msg.from._id.equals(meId) ? msg.to : msg.from;
      const key = String(other._id);

      if (!byPerson.has(key)) {
        byPerson.set(key, { user: other, lastMessage: msg, unread: 0 });
      }
      if (!msg.read && msg.to._id.equals(meId)) {
        byPerson.get(key).unread += 1;
      }
    });

    res.json({ conversations: Array.from(byPerson.values()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/messages/:userId, the whole conversation with one person
async function history(req, res, next) {
  try {
    const meId = req.currentUser._id;
    const other = req.params.userId;
    const { page, limit, skip } = paginate(req.query, 50, 200);

    const filter = {
      $or: [
        { from: meId, to: other },
        { from: other, to: meId },
      ],
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('from', 'username displayName avatar'),
      Message.countDocuments(filter),
    ]);

    res.json({ messages, total, page });
  } catch (err) {
    next(err);
  }
}

// GET /api/messages/search. takes a keyword, who it was with, and a date range
async function search(req, res, next) {
  try {
    const meId = req.currentUser._id;
    const { page, limit, skip } = paginate(req.query);
    const { keyword, withUser, dateFrom, dateTo, unreadOnly } = req.query;

    // this is the important bit. the base filter is always my own messages, so a
    // search can never reach into somebody else's chat
    const filter = { $or: [{ from: meId }, { to: meId }] };
    const and = [];

    if (keyword && keyword.trim()) and.push({ text: contains(keyword) });
    if (withUser) and.push({ $or: [{ from: withUser }, { to: withUser }] });
    if (unreadOnly === 'true') and.push({ read: false, to: meId });

    if (dateFrom || dateTo) {
      const range = {};
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from && !Number.isNaN(from.getTime())) range.$gte = from;
      if (to && !Number.isNaN(to.getTime())) {
        range.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
      }
      if (Object.keys(range).length) and.push({ createdAt: range });
    }

    if (and.length) filter.$and = and;

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('from', 'username displayName avatar')
        .populate('to', 'username displayName avatar'),
      Message.countDocuments(filter),
    ]);

    res.json({ messages, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// PUT /api/messages/:id, you can only edit a message you sent
async function update(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    if (!message.from.equals(req.currentUser._id)) {
      return res.status(403).json({ error: 'You can only edit your own messages.' });
    }

    message.text = req.body.text;
    await message.save();
    res.json({ ok: true, message });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/messages/:id, you can only delete a message you sent
async function remove(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    if (!message.from.equals(req.currentUser._id)) {
      return res.status(403).json({ error: 'You can only delete your own messages.' });
    }

    await message.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { showChat, conversations, history, search, update, remove };
