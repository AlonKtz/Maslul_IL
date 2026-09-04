/*
  Tests for the live chat, which runs over the socket rather than http.

  Two real socket clients connect at the same time, so I can send a message
  from one and check it actually arrives at the other, and check that a third
  person cannot read either of them.

  Run the server first, then: npm test
*/
const { io } = require('socket.io-client');
const { BASE, check, section, makeClient, stamp, report, serverIsUp } = require('./helpers');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Opens a socket carrying a member's session cookie.
function connect(cookie) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, {
      extraHeaders: { Cookie: cookie },
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
    setTimeout(() => reject(new Error('timed out')), 8000);
  });
}

(async () => {
  if (!(await serverIsUp())) {
    console.error('\n  The server is not running. Start it with npm start first.\n');
    process.exit(1);
  }

  const alice = makeClient();
  const bob = makeClient();
  const carol = makeClient();

  await alice('POST', '/auth/register', { username: 'ca_' + stamp, password: 'secret123' });
  await bob('POST', '/auth/register', { username: 'cb_' + stamp, password: 'secret123' });
  await carol('POST', '/auth/register', { username: 'cc_' + stamp, password: 'secret123' });

  let r = await alice('GET', '/api/users/search?username=ca_' + stamp);
  const aliceId = r.data.users[0]._id;
  r = await alice('GET', '/api/users/search?username=cb_' + stamp);
  const bobId = r.data.users[0]._id;

  // ---------------------------------------------------------------- connect
  section('connecting');

  let socketA = null;
  let socketB = null;

  try {
    socketA = await connect(alice.cookie());
    check('a logged in member can open a socket', true);
  } catch (err) {
    check('a logged in member can open a socket', false, err.message);
  }

  try {
    socketB = await connect(bob.cookie());
    check('and so can a second one', true);
  } catch (err) {
    check('and so can a second one', false, err.message);
  }

  check('it really is a websocket, not polling',
    socketA && socketA.io.engine.transport.name === 'websocket',
    socketA ? socketA.io.engine.transport.name : 'no socket');

  let refused = false;
  try {
    await connect('');
  } catch (err) {
    refused = true;
  }
  check('a socket with no session is refused', refused);

  // ---------------------------------------------------------------- sending
  section('sending and receiving');

  const gotByB = [];
  const gotByA = [];
  socketB.on('message:new', (m) => gotByB.push(m));
  socketA.on('message:new', (m) => gotByA.push(m));

  let ack = await new Promise((resolve) => {
    socketA.emit('message:send', { to: bobId, text: 'Are you coming on Friday?' }, resolve);
  });
  check('sending a message is accepted', ack && ack.ok === true, JSON.stringify(ack));

  await wait(700);
  check('it arrives at the other person live',
    gotByB.length === 1 && gotByB[0].text === 'Are you coming on Friday?',
    'got ' + gotByB.length);
  check('and comes back to my own tabs too', gotByA.length === 1);

  await new Promise((resolve) => {
    socketB.emit('message:send', { to: aliceId, text: 'Yes, bringing the Supra.' }, resolve);
  });
  await wait(700);
  check('the reply comes back live', gotByA.length === 2, 'got ' + gotByA.length);

  // ---------------------------------------------------------------- rubbish
  section('rubbish over the socket');

  ack = await new Promise((resolve) => socketA.emit('message:send', { to: bobId, text: '   ' }, resolve));
  check('an empty message is refused', ack && !!ack.error);

  ack = await new Promise((resolve) =>
    socketA.emit('message:send', { to: bobId, text: 'x'.repeat(1500) }, resolve));
  check('a message that is too long is refused', ack && !!ack.error);

  ack = await new Promise((resolve) => socketA.emit('message:send', { to: aliceId, text: 'hi me' }, resolve));
  check('messaging myself is refused', ack && !!ack.error);

  ack = await new Promise((resolve) =>
    socketA.emit('message:send', { to: '507f1f77bcf86cd799439011', text: 'ghost' }, resolve));
  check('messaging somebody who does not exist is refused', ack && !!ack.error);

  ack = await new Promise((resolve) =>
    socketA.emit('message:send', { to: 'not-an-id', text: 'bad' }, resolve));
  check('a broken recipient id is refused and does not crash it', ack && !!ack.error);

  // ---------------------------------------------------------------- saved
  section('the conversation is saved');

  const history = await new Promise((resolve) =>
    socketA.emit('history:load', { withUserId: bobId }, resolve));
  check('the history loads over the socket',
    history && history.messages && history.messages.length === 2,
    'got ' + (history && history.messages && history.messages.length));

  r = await alice('GET', '/api/messages/' + bobId);
  check('and over http as well', r.status === 200 && r.data.messages.length === 2);

  r = await alice('GET', '/api/messages/conversations');
  check('the conversation list is built', r.status === 200 && r.data.conversations.length === 1);

  r = await alice('GET', '/api/messages/search?keyword=Supra');
  check('searching my messages by word', r.status === 200 && r.data.total === 1);

  r = await alice('GET', '/api/messages/search?keyword=Friday&withUser=' + bobId
    + '&dateFrom=2020-01-01&dateTo=2035-01-01');
  check('message search, four parameters', r.status === 200 && r.data.total === 1);

  // ---------------------------------------------------------------- privacy
  section('nobody else can read it');

  r = await carol('GET', '/api/messages/' + aliceId);
  check('a third person sees none of our messages',
    r.status === 200 && r.data.messages.length === 0,
    'saw ' + (r.data && r.data.messages && r.data.messages.length));

  r = await carol('GET', '/api/messages/search?keyword=Supra');
  check('and cannot find them by searching', r.status === 200 && r.data.total === 0);

  // ---------------------------------------------------------------- edit
  section('editing and deleting my own messages');

  const mine = history.messages[0]._id;

  r = await bob('DELETE', '/api/messages/' + mine);
  check('I cannot delete somebody else\'s message, 403', r.status === 403, 'got ' + r.status);

  r = await alice('PUT', '/api/messages/' + mine, { text: 'Are you coming on Saturday?' });
  check('I can edit my own', r.status === 200);

  r = await alice('DELETE', '/api/messages/' + mine);
  check('I can delete my own', r.status === 200);

  // ---------------------------------------------------------------- extras
  section('typing and presence');

  const typing = await new Promise((resolve) => {
    let done = false;
    socketB.on('typing', (d) => { if (!done) { done = true; resolve(d); } });
    socketA.emit('typing', { to: bobId, typing: true });
    setTimeout(() => { if (!done) resolve(null); }, 1500);
  });
  check('the typing indicator reaches the other side', typing && typing.typing === true);

  const presence = await new Promise((resolve) => {
    let done = false;
    socketA.on('presence', (d) => { if (!done && d.online === false) { done = true; resolve(d); } });
    socketB.disconnect();
    setTimeout(() => { if (!done) resolve(null); }, 2000);
  });
  check('leaving tells everybody I went offline', presence && presence.online === false);

  socketA.disconnect();

  check('the server is still healthy afterwards', await serverIsUp());

  // tidy up
  await alice('DELETE', '/api/users/' + aliceId);
  await bob('DELETE', '/api/users/' + bobId);

  report();
})().catch((err) => {
  console.error('\n  the test run itself crashed:', err);
  process.exit(1);
});
