/*
  Shared bits for the test files.

  These tests talk to a running server over http, the same way the browser
  does. Start the server first with npm start, then run npm test in a second
  terminal.

  I wrote them because clicking through every page by hand after each change
  was taking too long, and it is easy to break a permission check without
  noticing.
*/
const BASE = process.env.TEST_URL || 'http://localhost:3000';

let pass = 0;
let fail = 0;
const lines = [];

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    lines.push('  ok   ' + name);
  } else {
    fail += 1;
    lines.push('  FAIL ' + name + (detail ? '   ' + detail : ''));
  }
}

function section(title) {
  lines.push('');
  lines.push('  --- ' + title + ' ---');
}

/*
  Each client keeps its own cookie, so I can have two members logged in at the
  same time inside one test run and check that one cannot touch the other's
  things.
*/
function makeClient() {
  let cookie = '';

  async function call(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers.Cookie = cookie;

    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null; // the response was html, not json
    }
    return { status: res.status, data };
  }

  call.cookie = () => cookie;
  return call;
}

// Every run makes its own usernames so repeated runs do not collide.
const stamp = Date.now().toString().slice(-6);

function report() {
  console.log(lines.join('\n'));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
}

async function serverIsUp() {
  try {
    const res = await fetch(BASE + '/login');
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

module.exports = { BASE, check, section, makeClient, stamp, report, serverIsUp };
