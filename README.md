# Maslul (מסלול)

**Israel's first social network for car lovers.**

Maslul is built around three things car people actually do: meet up, race, and
buy and sell parts. Members keep a virtual garage, join communities, host meets
and races, list items in a local marketplace, and talk to each other in real time.

Final project for the Web Application Development course.

---

## Running it

### 1. Requirements

* [Node.js](https://nodejs.org/) 18 or newer (developed on 22)
* A MongoDB database. Either a free [Atlas](https://www.mongodb.com/atlas) cluster
  or a local MongoDB server

### 2. Install

```bash
npm install
```

### 3. Configure

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

`.env` must contain:

| Variable | What it is |
|---|---|
| `MONGO_URI` | Your MongoDB connection string |
| `SESSION_SECRET` | Any long random string; it signs the session cookie |
| `PORT` | Optional, defaults to `3000` |
| `RECAP_YOUTUBE_ID` | Optional YouTube id for the weekly recap tab |

`.env` is listed in `.gitignore` and is never committed.

### 4. Add the demo data

```bash
npm run seed
```

This fills the database with members, groups, cars, events, listings and chat
history. It **clears the existing data first**; run `npm run seed -- keep` to add
to what is already there instead.

### 5. Start

```bash
npm start
```

Then open <http://localhost:3000>.

Use `npm run dev` while working on it. Nodemon restarts the server when a file
changes.

### Signing in

Every seeded member uses the password **`secret123`**.

| Username | Role |
|---|---|
| `alon` | Site administrator |
| `noa`, `yossi`, `dana`, `itai`, `maya`, `omer`, `tamar`, `eitan`, `shira`, `gil`, `roni` | Regular members |

---

## How it is put together

The application follows **MVC**, with the pieces in separate folders:

```
server.js              entry point: Express app, sessions, routes, websockets
config/db.js           MongoDB connection

src/
  models/              Model layer. Mongoose schemas and their validation
    User.js  Group.js  Event.js  Listing.js  Car.js  Message.js
  controllers/         Controller layer. All the logic lives here
  routes/              thin routers that map URLs to controller functions
  middleware/          authentication, validation, uploads, error handling
  socket/chat.js       Socket.io handlers for the live chat
  data/cities.js       Israeli cities with their coordinates
  utils/               small shared helpers

views/                 View layer. EJS templates
  partials/            head, nav, footer
  pages/               one file per page

public/
  css/style.css        all the styling
  js/                  client-side jQuery, one file per page
  components/          React components (.jsx)
  vendor/              jQuery, React, Babel, D3 and Socket.io, served locally
  uploads/             member-uploaded images (gitignored)
  video/               recap clips and the playlist
seed/seed.js           demo data
```

Everything the browser needs is **served from this project**, so the site works
with no internet connection.

### The models

| Model | What it holds |
|---|---|
| **User** | Accounts, roles, profile, friends and friend requests |
| **Group** | Communities, their manager, members and join requests |
| **Event** | Meets and races: type, date, city, coordinates, attendees |
| **Listing** | Marketplace items: price, category, condition, sold status |
| **Car** | The cars in a member's garage |
| **Message** | Chat history between two members |

All six support **create, update, delete, list and search** from the interface.

### Permissions

Access is decided on the server, never in the browser.

* **Guests** see only the landing, sign-in and registration pages.
* **Members** manage their own profile, garage, events and listings, and can
  only edit or delete things they own.
* **Group managers** additionally edit their group, approve or reject join
  requests and remove members.
* **Site administrators** can moderate anything.

Private groups are invisible to non-members, and a member's messages and pending
friend requests are only ever readable by that member.

---

## Notable features

### Area search on a hand-drawn map

The `/search` page draws a map of Israel on a `<canvas>` from stored
coordinates. There is no map library and no map tiles, so it needs no
internet at all. Click
points to outline the area you are willing to travel to, and the shape is sent
to the server, which answers with a MongoDB `$geoWithin` query against the
coordinates saved on each event or listing.

### Real-time chat

Chat runs over WebSockets with Socket.io. The socket reuses the Express session,
so it knows which member is connected without trusting anything the browser
sends, and a socket with no session is refused. Messages are delivered live to
every tab a member has open and saved to MongoDB, so the conversation survives a
reload. Typing indicators and online/offline presence are included.

### Live statistics

The `/stats` page draws four D3 charts from MongoDB aggregations run at the
moment the page loads. Add a car and press Refresh and the bars change.

### Validation everywhere

Forms are checked in the browser before anything is sent, then checked again on
the server with express-validator and the schema rules. A central error handler
means malformed input, bad ids, oversized payloads and unexpected values produce
a clear message instead of a crash.

---

## The technologies used

| Area | What is used |
|---|---|
| Server | Node.js, Express |
| Database | MongoDB with Mongoose |
| Architecture | MVC |
| Views | EJS |
| Client | jQuery with Ajax for every request to the server |
| Components | React (Video and Canvas), compiled in the browser with Babel |
| Styling | CSS3: `@font-face`, `text-shadow`, `transition`, multiple columns, `border-radius` |
| Real time | Socket.io / WebSockets |
| Charts | D3.js |
| Sessions | express-session with connect-mongo |
| Passwords | bcrypt |
| Uploads | multer |

---

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Runs the server |
| `npm run dev` | Runs the server with nodemon |
| `npm run seed` | Replaces the database contents with the demo data |
| `npm run seed -- keep` | Adds the demo data without clearing first |
