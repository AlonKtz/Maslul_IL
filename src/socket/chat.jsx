const { Server } = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/User');

/*
  The live chat between two members. This is the WebSocket side, using Socket.io.

  Every message gets sent straight to the other person if they are online, and
  it also gets saved to MongoDB so the conversation is still there after a
  refresh.

  For logging in I reuse the normal express session. The same cookie that logs
  you into the site tells the socket who you are. That matters, because it
  means the browser cannot just send me a different user id and pretend to be
  somebody else.
*/
function attachChat(server, sessionMiddleware) {
  const io = new Server(server);

  // gives socket.io access to the express session from the cookie
  io.engine.use(sessionMiddleware);

  // refuse any socket that does not come with a logged in session
  io.use(async (socket, next) => {
    const session = socket.request.session;
    if (!session || !session.userId) {
      return next(new Error('You must be logged in to chat.'));
    }

    try {
      const user = await User.findById(session.userId).select('username displayName avatar');
      if (!user) return next(new Error('Your account no longer exists.'));

      socket.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    const me = socket.user;

    // every member joins a room named after their own id. that way a message
    // reaches every tab or phone they have open, not just one of them.
    socket.join(String(me._id));

    // let everyone else know this person just came online
    socket.broadcast.emit('presence', { userId: String(me._id), online: true });

    // ------------------------------------------------------------ history
    // the browser asks for the whole conversation with one other person
    socket.on('history:load', async ({ withUserId }, ack) => {
      try {
        if (!withUserId) return ack && ack({ error: 'Choose somebody to talk to.' });

        const messages = await Message.find({
          $or: [
            { from: me._id, to: withUserId },
            { from: withUserId, to: me._id },
          ],
        })
          .sort({ createdAt: 1 })
          .limit(200)
          .populate('from', 'username displayName avatar');

        // they are looking at it now, so mark their messages as read
        await Message.updateMany({ from: withUserId, to: me._id, read: false }, { read: true });

        ack && ack({ messages });
      } catch (err) {
        console.error('[chat] history:load', err.message);
        ack && ack({ error: 'Could not load that conversation.' });
      }
    });

    // ------------------------------------------------------------ sending
    socket.on('message:send', async ({ to, text }, ack) => {
      try {
        const clean = typeof text === 'string' ? text.trim() : '';

        // I check the input here too, not just in the model. a socket is just
        // another way into the server so it gets the same checks as the routes.
        if (!clean) return ack && ack({ error: 'Write something first.' });
        if (clean.length > 1000) return ack && ack({ error: 'Message is too long.' });
        if (!to) return ack && ack({ error: 'No recipient.' });
        if (String(to) === String(me._id)) {
          return ack && ack({ error: 'You cannot message yourself.' });
        }

        const recipient = await User.findById(to).select('_id');
        if (!recipient) return ack && ack({ error: 'That member does not exist.' });

        const message = await Message.create({ from: me._id, to, text: clean });
        await message.populate('from', 'username displayName avatar');

        // send it to the other person, and back to my own tabs so they all update
        io.to(String(to)).emit('message:new', message);
        io.to(String(me._id)).emit('message:new', message);

        ack && ack({ ok: true, message });
      } catch (err) {
        console.error('[chat] message:send', err.message);
        ack && ack({ error: 'Could not send that message.' });
      }
    });

    // ------------------------------------------------------------ typing
    socket.on('typing', ({ to, typing }) => {
      if (!to) return;
      io.to(String(to)).emit('typing', {
        userId: String(me._id),
        typing: Boolean(typing),
      });
    });

    // ------------------------------------------------------------ leaving
    socket.on('disconnect', () => {
      socket.broadcast.emit('presence', { userId: String(me._id), online: false });
    });
  });

  return io;
}

module.exports = attachChat;
