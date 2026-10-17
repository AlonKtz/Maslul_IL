var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// tests/helpers.jsx
var require_helpers = __commonJS({
  "tests/helpers.jsx"(exports2, module2) {
    var BASE = process.env.TEST_URL || "http://localhost:3000";
    var pass = 0;
    var fail = 0;
    var lines = [];
    function check2(name, condition, detail) {
      if (condition) {
        pass += 1;
        lines.push("  ok   " + name);
      } else {
        fail += 1;
        lines.push("  FAIL " + name + (detail ? "   " + detail : ""));
      }
    }
    function section2(title) {
      lines.push("");
      lines.push("  --- " + title + " ---");
    }
    function makeClient2() {
      let cookie = "";
      async function call(method, path, body) {
        const headers = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        const res = await fetch(BASE + path, {
          method,
          headers,
          body: body ? JSON.stringify(body) : void 0,
          redirect: "manual"
        });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) cookie = setCookie.split(";")[0];
        let data = null;
        try {
          data = await res.json();
        } catch (err) {
          data = null;
        }
        return { status: res.status, data };
      }
      call.cookie = () => cookie;
      return call;
    }
    var stamp2 = Date.now().toString().slice(-6);
    function report2() {
      console.log(lines.join("\n"));
      console.log("\n  " + pass + " passed, " + fail + " failed\n");
      process.exit(fail ? 1 : 0);
    }
    async function serverIsUp2() {
      try {
        const res = await fetch(BASE + "/login");
        return res.status === 200;
      } catch (err) {
        return false;
      }
    }
    module2.exports = { BASE, check: check2, section: section2, makeClient: makeClient2, stamp: stamp2, report: report2, serverIsUp: serverIsUp2 };
  }
});

// tests/api.test.jsx
var { check, section, makeClient, stamp, report, serverIsUp } = require_helpers();
var soon = (days) => new Date(Date.now() + days * 864e5).toISOString();
(async () => {
  if (!await serverIsUp()) {
    console.error("\n  The server is not running. Start it with npm start first.\n");
    process.exit(1);
  }
  const alice = makeClient();
  const bob = makeClient();
  const carol = makeClient();
  section("accounts and validation");
  let r = await alice("POST", "/auth/register", {
    username: "a_" + stamp,
    password: "secret123",
    displayName: "Alice",
    location: "Haifa",
    bio: "Loves turbos"
  });
  check("register works", r.status === 201, JSON.stringify(r.data));
  r = await bob("POST", "/auth/register", {
    username: "b_" + stamp,
    password: "secret123",
    displayName: "Bob",
    location: "Eilat"
  });
  check("register a second member", r.status === 201);
  await carol("POST", "/auth/register", { username: "c_" + stamp, password: "secret123" });
  const anon = makeClient();
  r = await anon("POST", "/auth/register", { username: "a_" + stamp, password: "secret123" });
  check("the same username twice is refused", r.status === 409, "got " + r.status);
  r = await anon("POST", "/auth/register", { username: "x_" + stamp, password: "12" });
  check("a short password is refused", r.status === 400, "got " + r.status);
  r = await anon("POST", "/auth/register", { username: "bad name!", password: "secret123" });
  check("a username with spaces is refused", r.status === 400, "got " + r.status);
  r = await anon("POST", "/auth/login", { username: "a_" + stamp, password: "wrong" });
  check("the wrong password is refused", r.status === 401, "got " + r.status);
  r = await alice("GET", "/api/users/search?username=a_" + stamp);
  const aliceId = r.data.users[0]._id;
  r = await alice("GET", "/api/users/search?username=b_" + stamp);
  const bobId = r.data.users[0]._id;
  section("members");
  r = await alice("PUT", "/api/users/" + aliceId, { bio: "Turbo everything" });
  check("I can edit my own profile", r.status === 200);
  r = await bob("PUT", "/api/users/" + aliceId, { bio: "hacked" });
  check("I cannot edit somebody else, 403", r.status === 403, "got " + r.status);
  r = await alice("GET", "/api/users/search?username=a_" + stamp + "&location=Haifa&keyword=Turbo");
  check(
    "member search, three parameters",
    r.status === 200 && r.data.total >= 1,
    "total=" + (r.data && r.data.total)
  );
  r = await bob("GET", "/api/users/" + aliceId);
  check(
    "friend requests stay private to their owner",
    r.status === 200 && r.data.user.friendRequests === void 0
  );
  r = await bob("POST", "/api/users/" + aliceId + "/friend-request");
  check("sending a friend request works", r.status === 200);
  r = await bob("POST", "/api/users/" + aliceId + "/friend-request");
  check("sending it twice is refused", r.status === 409, "got " + r.status);
  r = await alice("POST", "/api/users/" + bobId + "/accept");
  check("accepting a friend request works", r.status === 200);
  section("cars, the garage");
  r = await alice("POST", "/api/cars", {
    make: "Toyota",
    model: "Supra",
    year: 1998,
    category: "Coupe",
    engine: "2JZ-GTE",
    horsepower: 320,
    color: "Red"
  });
  check("create a car", r.status === 201, JSON.stringify(r.data).slice(0, 90));
  const carId = r.data.car && r.data.car._id;
  await alice("POST", "/api/cars", {
    make: "Toyota",
    model: "Corolla",
    year: 2015,
    category: "Sedan",
    horsepower: 130,
    color: "White"
  });
  r = await alice("GET", "/api/cars?mine=true");
  check(
    "list my own cars",
    r.status === 200 && r.data.cars.length === 2,
    "count=" + (r.data.cars && r.data.cars.length)
  );
  r = await alice("PUT", "/api/cars/" + carId, {
    make: "Toyota",
    model: "Supra MK4",
    year: 1998,
    horsepower: 450
  });
  check("edit my own car", r.status === 200 && r.data.car.horsepower === 450);
  r = await bob("PUT", "/api/cars/" + carId, { make: "Stolen", model: "X", year: 2e3 });
  check("I cannot edit a car that is not mine, 403", r.status === 403, "got " + r.status);
  r = await bob("DELETE", "/api/cars/" + carId);
  check("I cannot delete a car that is not mine, 403", r.status === 403, "got " + r.status);
  r = await alice("GET", "/api/cars/search?make=Toyota&yearFrom=1990&yearTo=2000&hpMin=400&hpMax=600&category=Coupe");
  check(
    "car search, six parameters at once",
    r.status === 200 && r.data.cars.every(function(c) {
      return /toyota/i.test(c.make) && c.year >= 1990 && c.year <= 2e3 && c.horsepower >= 400 && c.horsepower <= 600 && c.category === "Coupe";
    }) && r.data.total >= 1,
    "total=" + (r.data && r.data.total)
  );
  r = await alice("GET", "/api/cars/search?make=Toyota&hpMin=99999");
  check(
    "a search that matches nothing returns nothing",
    r.status === 200 && r.data.total === 0,
    "total=" + (r.data && r.data.total)
  );
  section("groups");
  r = await alice("POST", "/api/groups", {
    name: "JDM " + stamp,
    description: "Japanese classics",
    category: "JDM",
    brand: "Toyota"
  });
  check("create a group", r.status === 201);
  const groupId = r.data.group && r.data.group._id;
  r = await alice("POST", "/api/groups", {
    name: "Private " + stamp,
    category: "Tuning",
    isPrivate: true
  });
  const privateId = r.data.group && r.data.group._id;
  check("create a private group", r.status === 201);
  r = await alice("PUT", "/api/groups/" + groupId, {
    name: "JDM " + stamp,
    description: "Updated",
    category: "JDM"
  });
  check("the manager can edit the group", r.status === 200);
  r = await bob("PUT", "/api/groups/" + groupId, { name: "Hijacked" });
  check("a member cannot edit the group, 403", r.status === 403, "got " + r.status);
  r = await alice("GET", "/api/groups/search?name=JDM&category=JDM&brand=Toyota&privacy=public");
  check("group search, four parameters", r.status === 200 && r.data.total >= 1);
  r = await bob("POST", "/api/groups/" + groupId + "/join");
  check("joining a public group is instant", r.status === 200 && r.data.joined === true);
  r = await bob("POST", "/api/groups/" + groupId + "/join");
  check("joining twice is refused", r.status === 409, "got " + r.status);
  r = await bob("POST", "/api/groups/" + privateId + "/join");
  check("joining a private group waits for approval", r.status === 200 && r.data.pending === true);
  r = await bob("POST", "/api/groups/" + privateId + "/approve", { userId: bobId });
  check("a member cannot approve themselves, 403", r.status === 403, "got " + r.status);
  r = await alice("POST", "/api/groups/" + privateId + "/approve", { userId: bobId });
  check("the manager can approve", r.status === 200);
  section("events, meets and races");
  r = await alice("POST", "/api/events", {
    title: "Haifa meet " + stamp,
    type: "meet",
    city: "Haifa",
    address: "Port",
    startsAt: soon(7),
    maxAttendees: 3
  });
  check("create a meet", r.status === 201, JSON.stringify(r.data).slice(0, 90));
  const meetId = r.data.event && r.data.event._id;
  check(
    "the city gives it map coordinates",
    r.data.event && r.data.event.location.coordinates.length === 2
  );
  r = await alice("POST", "/api/events", {
    title: "Eilat drag " + stamp,
    type: "race",
    raceType: "Drag",
    city: "Eilat",
    startsAt: soon(14)
  });
  check("create a race with a format", r.status === 201 && r.data.event.raceType === "Drag");
  const raceId = r.data.event && r.data.event._id;
  r = await alice("POST", "/api/events", { title: "x", type: "meet", city: "Paris", startsAt: soon(3) });
  check("a city I do not know is refused", r.status === 400, "got " + r.status);
  r = await alice("POST", "/api/events", { title: "x", type: "party", city: "Haifa", startsAt: soon(3) });
  check("an event type I do not know is refused", r.status === 400, "got " + r.status);
  r = await alice("POST", "/api/events", { title: "x", type: "meet", city: "Haifa", startsAt: "nonsense" });
  check("a date that is not a date is refused", r.status === 400, "got " + r.status);
  r = await bob("PUT", "/api/events/" + meetId, {
    title: "hijack",
    type: "meet",
    city: "Haifa",
    startsAt: soon(7)
  });
  check("only the host can edit an event, 403", r.status === 403, "got " + r.status);
  r = await alice("GET", "/api/events/search?keyword=" + stamp + "&type=race&raceType=Drag&city=Eilat");
  check(
    "event search, four parameters",
    r.status === 200 && r.data.total >= 1,
    "total=" + (r.data && r.data.total)
  );
  r = await bob("POST", "/api/events/" + meetId + "/attend");
  check("saying I am going works", r.status === 200 && r.data.attending === true);
  r = await bob("POST", "/api/events/" + meetId + "/attend");
  check("pressing it again cancels", r.status === 200 && r.data.attending === false);
  r = await alice("POST", "/api/events/" + meetId + "/attend");
  check("the host is always going, so it refuses", r.status === 400, "got " + r.status);
  await bob("POST", "/api/events/" + meetId + "/attend");
  await carol("POST", "/api/events/" + meetId + "/attend");
  const dave = makeClient();
  await dave("POST", "/auth/register", { username: "d_" + stamp, password: "secret123" });
  r = await dave("POST", "/api/events/" + meetId + "/attend");
  check("a full event refuses more people", r.status === 409, "got " + r.status);
  r = await bob("POST", "/api/events/" + meetId + "/comments", { text: "See you there" });
  check("comment on an event", r.status === 201 && r.data.comments.length === 1);
  section("the map area search");
  r = await alice("POST", "/api/events/area", {
    polygon: [[34, 29], [36, 29], [36, 30.5], [34, 30.5]]
  });
  check(
    "a box over the south only returns southern events",
    r.status === 200 && r.data.events.every(function(e) {
      const lat = e.location.coordinates[1];
      return lat >= 29 && lat <= 30.5;
    }),
    "total=" + (r.data && r.data.total)
  );
  r = await alice("POST", "/api/events/area", {
    polygon: [[34.4, 31.7], [35.2, 31.7], [35.2, 32.5], [34.4, 32.5]]
  });
  check(
    "a box over the centre only returns events inside it",
    r.status === 200 && r.data.events.every(function(e) {
      const c = e.location.coordinates;
      return c[0] >= 34.4 && c[0] <= 35.2 && c[1] >= 31.7 && c[1] <= 32.5;
    }),
    "total=" + (r.data && r.data.total)
  );
  r = await alice("POST", "/api/events/area", {
    polygon: [[30, 31], [32, 31], [32, 32], [30, 32]]
  });
  check("a box over the sea returns nothing", r.status === 200 && r.data.total === 0);
  r = await alice("POST", "/api/events/area", { polygon: [[34, 31], [35, 31]] });
  check("two points is not a shape, refused", r.status === 400, "got " + r.status);
  r = await alice("POST", "/api/events/area", { polygon: "not an array" });
  check("a polygon that is not a list is refused", r.status === 400, "got " + r.status);
  r = await alice("POST", "/api/events/area", { polygon: [[999, 999], [1, 2], [3, 4]] });
  check("coordinates off the planet are refused", r.status === 400, "got " + r.status);
  r = await alice("POST", "/api/events/area", { polygon: [["a", "b"], [1, 2], [3, 4]] });
  check("letters instead of coordinates are refused", r.status === 400, "got " + r.status);
  section("the marketplace");
  r = await alice("POST", "/api/listings", {
    title: "BBS wheels " + stamp,
    price: 3200,
    category: "Wheels & tires",
    condition: "Used",
    city: "Haifa"
  });
  check("create a listing", r.status === 201);
  const wheelsId = r.data.listing && r.data.listing._id;
  r = await alice("POST", "/api/listings", {
    title: "MX-5 " + stamp,
    price: 42e3,
    category: "Whole car",
    condition: "Used",
    city: "Tel Aviv",
    make: "Mazda",
    model: "MX-5",
    year: 1994
  });
  check("create a whole car listing", r.status === 201);
  r = await alice("POST", "/api/listings", {
    title: "x",
    price: -5,
    category: "Tools",
    city: "Haifa"
  });
  check("a negative price is refused", r.status === 400, "got " + r.status);
  r = await alice("POST", "/api/listings", {
    title: "x",
    price: 10,
    category: "Spaceship",
    city: "Haifa"
  });
  check("a category I do not have is refused", r.status === 400, "got " + r.status);
  r = await bob("PUT", "/api/listings/" + wheelsId, {
    title: "mine now",
    price: 1,
    category: "Tools",
    city: "Haifa"
  });
  check("only the seller can edit a listing, 403", r.status === 403, "got " + r.status);
  r = await alice("GET", "/api/listings/search?category=Whole%20car&make=Mazda&priceMin=1000&priceMax=50000&yearFrom=1990&yearTo=2000");
  check(
    "listing search, six parameters",
    r.status === 200 && r.data.listings.every(function(l) {
      return l.category === "Whole car" && /mazda/i.test(l.make) && l.price >= 1e3 && l.price <= 5e4;
    }) && r.data.total >= 1,
    "total=" + (r.data && r.data.total)
  );
  r = await alice("POST", "/api/listings/" + wheelsId + "/sold");
  check("the seller can mark it sold", r.status === 200 && r.data.status === "sold");
  r = await alice("GET", "/api/listings/search?keyword=BBS " + stamp);
  check(
    "sold things drop out of the search",
    r.status === 200 && !r.data.listings.some(function(l) {
      return l._id === wheelsId;
    })
  );
  r = await bob("POST", "/api/listings/" + wheelsId + "/sold");
  check("a buyer cannot mark it sold, 403", r.status === 403, "got " + r.status);
  section("private groups stay private");
  await alice("POST", "/api/events", {
    title: "Secret " + stamp,
    type: "meet",
    city: "Haifa",
    startsAt: soon(5),
    group: privateId
  });
  r = await carol("GET", "/api/events?group=" + privateId);
  check(
    "somebody outside a private group cannot read it",
    r.status === 403,
    "got " + r.status
  );
  r = await carol("POST", "/api/events", {
    title: "sneaking in",
    type: "meet",
    city: "Haifa",
    startsAt: soon(5),
    group: privateId
  });
  check("somebody outside cannot post into it, 403", r.status === 403, "got " + r.status);
  section("the admin area");
  r = await alice("GET", "/api/admin/overview");
  check("a normal member cannot see the admin data, 403", r.status === 403, "got " + r.status);
  r = await alice("GET", "/api/admin/members");
  check("a normal member cannot list every member, 403", r.status === 403, "got " + r.status);
  r = await alice("POST", "/api/admin/members/" + aliceId + "/role", { role: "admin" });
  check("a normal member cannot promote themselves, 403", r.status === 403, "got " + r.status);
  section("the statistics, all five charts");
  const endpoints = [
    "summary",
    "events-per-month",
    "cars-by-make",
    "listings-by-category",
    "events-by-city",
    "group-activity"
  ];
  for (const name of endpoints) {
    r = await alice("GET", "/api/stats/" + name);
    const ok = r.status === 200 && r.data && (Array.isArray(r.data.data) || typeof r.data.members === "number");
    check("stats endpoint " + name + " answers", ok, "got " + r.status);
  }
  section("rubbish input, the server must not fall over");
  r = await alice("GET", "/api/cars/not-a-real-id");
  check("a broken id in the url is refused", r.status === 400, "got " + r.status);
  r = await alice("GET", "/api/cars/search?make=" + encodeURIComponent("((((") + "&yearFrom=abc");
  check("regex characters in a search do not break it", r.status === 200, "got " + r.status);
  r = await alice("GET", "/api/cars?limit=999999");
  check(
    "a huge page size gets capped",
    r.status === 200 && r.data.cars.length <= 50,
    "count=" + (r.data.cars && r.data.cars.length)
  );
  r = await anon("GET", "/api/cars");
  check("the api needs a login, 401", r.status === 401, "got " + r.status);
  r = await anon("POST", "/api/events", { title: "spam", type: "meet", city: "Haifa", startsAt: soon(1) });
  check("posting without a login, 401", r.status === 401, "got " + r.status);
  const up = await serverIsUp();
  check("the server is still healthy after all of that", up);
  await alice("DELETE", "/api/listings/" + wheelsId);
  await alice("DELETE", "/api/events/" + raceId);
  await alice("DELETE", "/api/groups/" + groupId);
  await alice("DELETE", "/api/groups/" + privateId);
  await alice("DELETE", "/api/users/" + aliceId);
  report();
})().catch((err) => {
  console.error("\n  the test run itself crashed:", err);
  process.exit(1);
});
