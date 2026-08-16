const { Server } = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Real-time chat between two members, over WebSockets (Socket.io).
 *
 * Messages are delivered live to whoever is online and are also written to
 * MongoDB, so a conversation is still there after a reload.
 *
 * Authentication reuses the Express session: the same cookie that logs a
 * member into the site identifies them on the socket, so nobody can claim to
 * be somebody else by sending a different id from the client.
 */
function attachChat(server, sessionMiddleware) {
  const io = new Server(server);

  // Let Socket.io read the Express session from the handshake cookie.
  io.engine.use(sessionMiddleware);

  // Reject any connection that does not carry a logged-in session.
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

    // Each member joins a room named after their own id, so a message can be
    // delivered to every tab or device that member has open.
    socket.join(String(me._id));

    // Tell everyone this member is now online.
    socket.broadcast.emit('presence', { userId: String(me._id), online: true });

    // ------------------------------------------------------------ history
    // The client asks for the conversation with one other member.
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

        // Anything they sent us is now read.
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

        // Validate here as well as in the model — a socket is just another
        // door into the server and gets the same checks as the REST routes.
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

        // Deliver to the recipient's room and back to the sender's own tabs.
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
