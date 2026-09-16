# Maslul (מסלול)
# Software Requirements Specification

| | |
|---|---|
| Project | Maslul, a social network for car lovers in Israel |
| Document | SRS, version 1.0 |
| Date | 17 September 2026 |
| Author | Alon Katz |
| Course | Web Application Development, final project |
| Status | Reverse engineered from the working system at commit `f01dd61` |

This document was written from the finished system, so every requirement in it describes behaviour that exists in the code today. Whenever the system changes, this document is updated in the same commit so the two never disagree. The change log at the end records each update.

How to read the identifiers:

| Prefix | Meaning |
|---|---|
| FR-xxx | Functional requirement |
| NFR-xxx | Non-functional requirement |
| BR-xxx | Business rule |
| VAL-xxx | Validation rule |
| ERR-xxx | Error handling rule |
| SCR-xxx | Screen |

---

## 1. Introduction

### 1.1 Purpose of the system

Maslul is a web application where people who love cars can meet each other, show off the cars in their garage, organise car meets and races, buy and sell cars and parts, form communities around brands and interests, and chat with each other in real time. It is meant to be the first social network in Israel built specifically for car enthusiasts.

The problem it solves: today this activity is scattered across WhatsApp groups and general marketplaces that know nothing about cars. Maslul puts meets, races, garages, the marketplace and the community in one place, with search that understands cars (make, model, year, horsepower) and geography (find everything inside an area you draw on a map).

### 1.2 Target audience

| Audience | What they use Maslul for |
|---|---|
| Car enthusiasts (members) | Showing their cars, joining meets and races, buying and selling, chatting |
| Meet and race organisers (event hosts) | Publishing an event, managing who attends |
| Community managers (group managers) | Running a group, approving members, hosting group events |
| Site administrators | Overseeing members and content, granting admin rights |
| Course lecturers and testers | Verifying that the system meets the project brief |

### 1.3 Definitions and terms

| Term | Meaning |
|---|---|
| Member | A registered user who is logged in. The `user` role. |
| Guest | Somebody who is not logged in. |
| Site admin, Admin | A member whose `role` is `admin`. Can act on any record. |
| Group manager, Manager | The member who created a group (`group.admin`). |
| Event | A car meet or a race. One record in the `events` collection. |
| Meet | An event of type `meet`. |
| Race | An event of type `race`. It has a race format, a circuit and a lap count. |
| Race format, Race type | One of Drag, Track, Rally, Hillclimb, Drift, Time attack. |
| Circuit | One of the tracks in the built in library (`src/data/circuits.js`). It has a length in km and a layout drawn on a canvas. |
| Listing | An item for sale in the marketplace: a whole car, a part, a tool. |
| Garage | The cars a member owns. "Community garage" is every car on the site. |
| Feed | The member's personal timeline of events and listings from friends and groups. |
| Area search | Drawing a polygon on the map and finding events or listings whose stored coordinates fall inside it. |
| Circle | A member plus their friends plus the groups they belong to. The feed is built from the circle. |
| RSVP, Attend | A member saying they are going to an event. |
| Session | The server side record that a browser is logged in as a given member. Kept in MongoDB, referenced by the `connect.sid` cookie. |
| Ajax | Browser requests made by jQuery to the `/api/...` endpoints that return JSON. |
| Socket | A Socket.io WebSocket connection used by the chat. |
| CRUD | Create, Read, Update, Delete. |
| MVC | Model, View, Controller. The code layout of the server. |
| SRS | This document. |
| QA | Quality assurance, the people testing the system. |

---

## 2. General description of the system

### 2.1 Business goals

1. Give Israeli car enthusiasts one place for meets, races, garages, buying and selling and community.
2. Make it easy to find what is happening near you: by city, by date and by drawing an area on a map.
3. Let communities organise themselves, with a manager who controls membership and can keep a group private.
4. Provide live conversation between members, so arranging a meet or a sale does not have to leave the site.
5. Show the life of the community in numbers: how many meets per month, which makes are popular, what sells.
6. Satisfy the course brief: Node.js and Express in MVC, MongoDB, at least three models with full CRUD and search reachable from the UI, at least two searches with three or more parameters, jQuery and Ajax throughout, React with a video and a canvas component, CSS3, Socket.io, D3 charts from live data, validation on both sides, and no crashes.

### 2.2 System boundaries

**Inside the system**

- Member accounts, sign up, sign in, sign out, profile, friends.
- Cars in a member's garage, and the community garage.
- Events (meets and races) with attendance, likes and comments.
- Marketplace listings with sold status, likes and comments.
- Groups with a manager, members, join requests, private groups.
- The personal feed and people suggestions.
- Search: dedicated search page with map area search, member search and group search; plus the search forms on the events, market, garage, groups and chat pages.
- Real time one to one chat with history, typing indicator, presence, edit and delete.
- Statistics page with live charts.
- Admin page for site administrators.
- Motorsport page with the newest GT World video.
- Image upload for avatars, cars, events, listings and group covers. Video upload for the clip player.
- Demo data seeding.

**Outside the system**

- Payments. Buying and selling is arranged between members; Maslul does not move money.
- Email, SMS, push notifications, password reset by email.
- Group chat. Chat is one to one only.
- Free form posts or a wall. Content is always an event or a listing.
- Moderation tools beyond what the admin page offers (no reports, no bans).
- Map tiles or a map provider. The map is drawn from stored coordinates, offline.
- Producing the "Around the world" motorsport feed. The page shows an honest placeholder for it.
- Mobile apps. The system is a website that also works on phone browsers.

---

## 3. User types and permissions

### 3.1 User types

| Type | How you become one |
|---|---|
| Guest | Anybody not logged in |
| Member | Register, or log in with an existing account (`role: user`) |
| Group manager | A member who created a group. The role applies only inside that group. |
| Event host | A member who created an event. The role applies only to that event. |
| Seller | A member who created a listing. The role applies only to that listing. |
| Site admin | A member whose role was set to `admin` by another admin (or by the seed script; the seeded `alon` account is an admin) |

### 3.2 Permission matrix

"Own" means a record the member created (their car, their event, their listing, their message, their profile).

| Action | Guest | Member | Manager (of that group) | Site admin |
|---|---|---|---|---|
| View landing page, sign in, sign up | Yes | Redirected to feed | Redirected to feed | Redirected to feed |
| View any other page or `/api` endpoint | No (redirect to `/login`, or 401 JSON) | Yes | Yes | Yes |
| View any member's profile and cars | No | Yes | Yes | Yes |
| Edit or delete a profile | No | Own only | Own only | Any |
| Send, accept friend requests, unfriend | No | Yes | Yes | Yes |
| Add a car; edit or delete a car | No | Own only | Own only | Any |
| Create an event | No | Yes | Yes | Yes |
| Create an event on behalf of a group | No | Only if a member of that group | Yes | Yes |
| Edit or delete an event | No | Host only | Host only | Any |
| Attend, like, comment on an event | No | Yes | Yes | Yes |
| Delete a comment on an event | No | Own comment, or any comment if host | Same as member | Any |
| Create a listing | No | Yes | Yes | Yes |
| Edit, delete, mark sold a listing | No | Seller only | Seller only | Any |
| Like, comment on a listing | No | Yes | Yes | Yes |
| Delete a comment on a listing | No | Own comment, or any comment if seller | Same as member | Any |
| Create a group | No | Yes (becomes its manager) | Yes | Yes |
| Edit or delete a group | No | No | Yes | Yes |
| Join a public group | No | Yes | n/a | Yes |
| Ask to join a private group | No | Yes | n/a | Yes |
| Leave a group | No | Yes | No (manager cannot leave) | Yes |
| Approve, reject, remove members | No | No | Yes | Yes |
| View a private group's page and events | No | Members only | Yes | Yes |
| Chat with a member | No | Yes | Yes | Yes |
| Read a conversation | No | Only the two participants | Same | Same (admins have no special access to chat) |
| Edit or delete a chat message | No | Own only | Own only | Own only |
| View feed, stats, search, motorsport | No | Yes | Yes | Yes |
| View the admin page and admin API | No | No (403) | No (403) | Yes |
| Change another member's role | No | No | No | Yes (not their own) |
| Upload images or video | No | Yes | Yes | Yes |

---

## 4. Functional requirements

Every requirement below follows the same shape: description, input, process, output, preconditions, postconditions. HTTP status codes are given because they are what a tester will see. "Logged in" means the browser holds a valid session cookie; every requirement from FR-010 onward requires it unless stated otherwise.

### 4.1 Accounts and sessions

#### FR-001 Register

- **Description:** The system lets a guest create an account.
- **Input:** `username`, `password`, optional `displayName`, `location`, `bio`. Form on `/register`, sent by Ajax to `POST /auth/register`.
- **Process:** Validate the fields (VAL-001 to VAL-005). Lower-case the username and check it is not taken. Hash the password with bcrypt. Save the user with role `user`, the default avatar, and `displayName` defaulting to the username. Start a session.
- **Output:** `201 {ok:true, redirect:"/feed"}` and the browser goes to the feed. On a taken username `409 "That username is already taken."`. On invalid input `400` with the first message and a list of all messages.
- **Preconditions:** Not logged in (a logged in visitor is redirected to `/feed`).
- **Postconditions:** A user document exists; the visitor is logged in.

#### FR-002 Log in

- **Description:** The system lets a guest sign in with username and password.
- **Input:** `username`, `password`. Form on `/login`, `POST /auth/login`.
- **Process:** Look the user up by lower-cased username, compare the password with the stored bcrypt hash.
- **Output:** `200 {ok:true, redirect:"/feed"}`. On wrong username **or** wrong password the same `401 "Incorrect username or password."` (the system never says which one was wrong). Missing field: `400`.
- **Preconditions:** Not logged in.
- **Postconditions:** Session holds the user's id; a cookie `connect.sid` is set (httpOnly, 7 days, secure when hosted over https).

#### FR-003 Log out

- **Description:** The system ends the member's session.
- **Input:** Click "Log out" in the navigation bar, `POST /auth/logout`.
- **Process:** Destroy the session document and clear the cookie.
- **Output:** `200 {ok:true, redirect:"/"}`, browser goes to the landing page.
- **Preconditions:** Logged in.
- **Postconditions:** Requests with the old cookie are treated as a guest.

#### FR-004 Session persistence

- **Description:** A session survives a server restart and lasts one week.
- **Process:** Sessions are stored in MongoDB (connect-mongo). On every request the user is loaded from the session id and attached to the request; if the user no longer exists the session is destroyed.
- **Output:** After a restart the member is still logged in. After the user is deleted, the next request is treated as a guest.

#### FR-005 Access control for pages and API

- **Description:** Every page and endpoint except the landing page, `/login`, `/register`, the auth endpoints and static files requires a logged in member.
- **Process:** `requireLogin` middleware. A page request is redirected to `/login`; an Ajax or `/api` request receives `401 {error:"You must be logged in to do that."}`.
- **Output:** As above. Admin-only routes return `403 "Administrator access required."` (JSON) or a 403 error page.

### 4.2 Profiles and friends

#### FR-010 View a profile

- **Description:** A member can open any member's profile page.
- **Input:** `GET /profile/:username`.
- **Process:** Load the member, their cars (newest first), how many events they host, how many listings they sell, and the groups they belong to. Work out whether the viewer is that member, already a friend, or has a pending request.
- **Output:** The profile page (SCR-090). Unknown username: 404 error page "No member with that username."
- **Preconditions:** Logged in.

#### FR-011 Read member records over the API

- **Description:** List and read members as JSON.
- **Input:** `GET /api/users?page&limit`, `GET /api/users/:id`.
- **Process:** Public fields only (username, displayName, avatar, location, bio, friends, createdAt). Pending friend requests are included only when a member reads their own record. Password is never returned.
- **Output:** `{users,total,page,pages}` or `{user}`. Bad id: `400 "Invalid id."`. Unknown: `404 "Member not found."`.

#### FR-012 Search members

- **Description:** Find members by four parameters. Reachable from the Search page, "Find members" tab.
- **Input:** `GET /api/users/search?username&location&keyword&carMake`, all optional.
- **Process:** `username` matches username **or** display name (contains, case-insensitive). `location` contains. `keyword` searches the bio. `carMake` finds every car whose make contains the text and returns their owners. Filters combine with AND. Paginated.
- **Output:** `{users,total,page,pages,filter}` and result cards with avatar, name, location and an "Open profile" link.
- **Postconditions:** None.

#### FR-013 Edit own profile

- **Description:** A member changes their display name, bio, location, avatar and optionally their password.
- **Input:** `PUT /api/users/:id` with any of `displayName`, `bio`, `location`, `avatar`, `newPassword` + `currentPassword`. Form on the profile page, own profile only.
- **Process:** Refuse unless `:id` is the member's own id or the member is a site admin (`403 "You can only edit your own profile."`). Validate lengths (VAL-003 to VAL-005). If `newPassword` is given, a non-admin must supply the correct `currentPassword` (`401 "Your current password is incorrect."`); the new password is re-hashed.
- **Output:** `{ok:true,user}` with the public fields.
- **Postconditions:** The profile and, if changed, the password hash are updated.

#### FR-014 Delete an account

- **Description:** A member deletes their own account; an admin can delete any account.
- **Input:** `DELETE /api/users/:id`.
- **Process:** Refuse if not own account and not admin (`403`). Delete the member's cars, hosted events and listings; remove the member from every friend list and every group; delete the groups they manage together with those groups' events; delete the user. If the member deleted themselves, destroy their session.
- **Output:** `{ok:true, redirect:"/"}` for self, `{ok:true}` for admin.
- **Postconditions:** No record of the member or their content remains, except chat messages, which stay for the other participant.

#### FR-015 Send a friend request

- **Input:** `POST /api/users/:id/friend-request`. Button on the profile page.
- **Process:** Refuse self (`400 "You cannot add yourself."`), already friends (`409 "You are already friends."`), duplicate (`409 "Request already sent."`), unknown member (`404`). Otherwise add the sender to the target's `friendRequests`.
- **Output:** `{ok:true}`; the button changes to "Request sent".

#### FR-016 Accept a friend request

- **Input:** `POST /api/users/:id/accept`, where `:id` is the person who sent the request.
- **Process:** Refuse if there is no pending request from them (`404 "No pending request from that member."`). Remove the request, add each member to the other's `friends`.
- **Output:** `{ok:true}`.
- **Postconditions:** Friendship is mutual; each now appears in the other's feed.

#### FR-017 Unfriend

- **Input:** `POST /api/users/:id/unfriend`.
- **Process:** Remove each from the other's friend list. Not an error if they were not friends.
- **Output:** `{ok:true}`.

#### FR-018 People you might know

- **Input:** `GET /api/feed/suggestions`. Shown in the feed sidebar.
- **Process:** Up to 5 members who are not the viewer, not already friends, and who the viewer has not already sent a request to. Also returns the viewer's groups.
- **Output:** `{suggestions, groups}` rendered with an "Add" button per person.

### 4.3 Garage (cars)

#### FR-020 Add a car

- **Description:** A member adds a car to their garage.
- **Input:** `POST /api/cars` with `make`, `model`, `year`, optional `horsepower`, `category`, `color`, `engine`, `description`, `photo` (a URL returned by FR-100). Form on `/garage`.
- **Process:** Validate (VAL-020 to VAL-027). Save with `owner` = the member. Missing photo gets the default car image.
- **Output:** `201 {ok:true, car}`; the card appears in "My garage" without a page reload.
- **Postconditions:** The car counts in the community garage and in statistics.

#### FR-021 View cars

- **Input:** `GET /api/cars` (everyone's cars), `GET /api/cars?mine=true` (own), `GET /api/cars?owner=<id>`, `GET /api/cars/:id`.
- **Process:** Paginated, newest first, owner populated (username, displayName, avatar).
- **Output:** `{cars,total,page,pages}` or `{car}`; `404 "Car not found."`.

#### FR-022 Search cars (community garage)

- **Description:** Find cars by up to eight parameters. Form on `/garage`, "Community garage" tab.
- **Input:** `GET /api/cars/search?make&model&category&color&yearFrom&yearTo&hpMin&hpMax`.
- **Process:** Text fields are contains/case-insensitive; `category` must be one of the body types; year and horsepower are inclusive ranges; non-numeric range values are ignored. AND between filters. Paginated.
- **Output:** `{cars,total,page,pages,filter}`.

#### FR-023 Edit a car

- **Input:** `PUT /api/cars/:id`, same fields as FR-020. "Edit" on the member's own card fills the form.
- **Process:** Owner or admin only (`403 "You can only edit cars in your own garage."`). Same validation as create.
- **Output:** `{ok:true, car}`.

#### FR-024 Delete a car

- **Input:** `DELETE /api/cars/:id`, after a confirm dialog.
- **Process:** Owner or admin only (`403 "You can only delete cars from your own garage."`).
- **Output:** `{ok:true}`; the card disappears.

### 4.4 Events (meets and races)

#### FR-030 Create an event

- **Description:** A member publishes a meet or a race.
- **Input:** `POST /api/events` with `title`, `type` (meet|race), `city` (from the list), `startsAt`, optional `description`, `address`, `maxAttendees`, `group`, `coverImage`; for a race also `raceType`, `circuit`, `laps`. Form on `/events` under "Create".
- **Process:** Validate (VAL-030 to VAL-039). Look up the city's coordinates and store them as a GeoJSON point. If `group` is given, the host must be a member or the manager of that group (`403 "Join the group before hosting an event for it."`; unknown group `404`). For a meet the race fields are cleared. The host is added as the first attendee.
- **Output:** `201 {ok:true, event}`; the list refreshes.
- **Postconditions:** The event appears in upcoming lists, searches, the area search, the feeds of the host's friends and the group's members, and statistics.

#### FR-031 List events

- **Input:** `GET /api/events` (upcoming, soonest first), `?mine=true` (hosted by me), `?attending=true`, `?past=true` (already happened, latest first), `?group=<id>`, `?type=meet|race`. Tabs on `/events`.
- **Process:** Events of private groups the member does not belong to are excluded (BR-030). Asking for one private group you cannot see: `403 "This group is private."`. Paginated.
- **Output:** `{events,total,page,pages}` with host and group populated.

#### FR-032 Search events

- **Description:** Find events by up to six parameters. Form on `/events` under "Search".
- **Input:** `GET /api/events/search?keyword&type&raceType&city&dateFrom&dateTo&includePast`.
- **Process:** `keyword` matches title or description. `type`, `raceType`, `city` must be valid values or are ignored. `dateTo` includes the whole day. Without dates, only upcoming events unless `includePast=true`. Private group rule applies. Sorted soonest first, paginated.
- **Output:** `{events,total,page,pages,filter}`.

#### FR-033 Area search for events

- **Description:** Find events inside a polygon the member drew on the canvas map on `/search`.
- **Input:** `POST /api/events/area` with `polygon: [[lng,lat],...]`, optional `type`, `dateFrom`, `dateTo`, `includePast`.
- **Process:** Refuse fewer than 3 points (`400 "Draw an area with at least three points."`), a malformed point (`400 "Bad point"`), or coordinates outside longitude −180..180 / latitude −90..90 (`400 "Point is outside the world"`). Close the ring if needed. Run a MongoDB `$geoWithin` query on the stored coordinates. Apply the type, date and private group rules. At most 100 results, soonest first.
- **Output:** `{events,total}`; the map draws a marker per result and lists them beside it.

#### FR-034 View an event page

- **Input:** `GET /events/:id`.
- **Process:** Load host, group, attendees and comment authors. For a race, load the circuit from the library.
- **Output:** The event page (SCR-041) including, for a race, the circuit canvas with the layout, a moving car, length per lap, laps, total distance and race format. Unknown id: 404 page "That meet or race does not exist."

#### FR-035 Edit an event

- **Input:** `PUT /api/events/:id`, same fields as create. "Edit" on the host's own card.
- **Process:** Host or admin only (`403 "Only the host can edit this event."`). If the city changes the coordinates change with it. If the type becomes `meet`, `raceType`, `circuit` and `laps` are reset.
- **Output:** `{ok:true, event}`.

#### FR-036 Delete an event

- **Input:** `DELETE /api/events/:id`, after a confirm dialog.
- **Process:** Host or admin only (`403 "Only the host can delete this event."`).
- **Output:** `{ok:true}`.

#### FR-037 Attend / cancel attendance

- **Input:** `POST /api/events/:id/attend`. Toggle button on the event page and cards.
- **Process:** The host cannot toggle (`400 "The host is always attending."`). If not attending and the event has a limit that is reached: `409 "This event is full."`. Otherwise add or remove the member.
- **Output:** `{ok:true, attending, count}`; the button and the "going" counter update in place.

#### FR-038 Like / unlike an event

- **Input:** `POST /api/events/:id/like`.
- **Process:** Toggle the member in `likes`.
- **Output:** `{ok:true, likes, liked}`.

#### FR-039 Comment on an event, delete a comment

- **Input:** `POST /api/events/:id/comments {text}`; `DELETE /api/events/:id/comments/:commentId`.
- **Process:** Text 1..500 characters (VAL-090). Delete allowed for the comment's author, the event host, or an admin (`403 "You cannot delete this comment."`); unknown comment `404`.
- **Output:** `201 {ok:true, comments}` with authors populated; `{ok:true}` on delete.

### 4.5 Marketplace (listings)

#### FR-040 Create a listing

- **Input:** `POST /api/listings` with `title`, `price`, `category`, `city`, optional `description`, `condition`, `make`, `model`, `year`, `photos[]` (URLs from FR-101, at most 6). Form on `/market` under "Sell something".
- **Process:** Validate (VAL-040 to VAL-049). Store the city's coordinates. Status starts as `available`. Seller = the member.
- **Output:** `201 {ok:true, listing}`.
- **Postconditions:** Visible in the market, in searches, in the area search, in friends' feeds and in statistics.

#### FR-041 List listings

- **Input:** `GET /api/listings` (available items, newest first), `?mine=true` (own, sold included), `?includeSold=true`, `?seller=<id>`, `GET /api/listings/:id`.
- **Output:** `{listings,total,page,pages}` with seller populated; `404 "Listing not found."`.

#### FR-042 Search listings

- **Description:** Find items by up to eleven parameters. Form on `/market`.
- **Input:** `GET /api/listings/search?keyword&category&condition&city&priceMin&priceMax&make&model&yearFrom&yearTo&includeSold&sort`.
- **Process:** `keyword` matches title or description; `category`, `condition`, `city` must be valid values; price and year are inclusive ranges; sold items are excluded unless `includeSold=true`; `sort` is `newest` (default), `price-asc` or `price-desc`. Paginated.
- **Output:** `{listings,total,page,pages,filter}`.

#### FR-043 Area search for listings

- **Input:** `POST /api/listings/area` with `polygon`, optional `category`, `priceMax`. The Search page map with "Looking for: Items for sale".
- **Process:** Same polygon checks as FR-033. Only `available` items. At most 100, newest first.
- **Output:** `{listings,total}`.

#### FR-044 View a listing page

- **Input:** `GET /market/:id`.
- **Output:** The listing page (SCR-051) with photos, price, condition, city, seller card, "Message seller" link to the chat, likes and comments. Unknown id: 404 page.

#### FR-045 Edit a listing

- **Input:** `PUT /api/listings/:id`.
- **Process:** Seller or admin only (`403 "You can only edit your own listings."`). Photos are capped at 6. City change updates coordinates.
- **Output:** `{ok:true, listing}`.

#### FR-046 Delete a listing

- **Input:** `DELETE /api/listings/:id`, after a confirm dialog.
- **Process:** Seller or admin only (`403 "You can only delete your own listings."`).
- **Output:** `{ok:true}`.

#### FR-047 Mark sold / back on sale

- **Input:** `POST /api/listings/:id/sold`.
- **Process:** Seller or admin only (`403 "Only the seller can change this."`). Toggles `status` between `available` and `sold`.
- **Output:** `{ok:true, status}`; a "Sold" badge appears and the item leaves the public market list.

#### FR-048 Like a listing; FR-049 Comment on a listing

- Same behaviour as FR-038 and FR-039 with the seller in place of the host.

### 4.6 Groups

#### FR-050 Create a group

- **Input:** `POST /api/groups` with `name`, optional `description`, `category`, `brand`, `isPrivate`, `coverImage`. Form on `/groups`.
- **Process:** Validate (VAL-050 to VAL-054). Name must be unique (`409 "That name is already taken."`). The creator becomes `admin` (manager) and the first member.
- **Output:** `201 {ok:true, group}`.

#### FR-051 List and search groups

- **Input:** `GET /api/groups`, `?mine=true` (member of or managing), `GET /api/groups/search?name&category&brand&privacy&minMembers`. Search form on `/groups` and on the Search page "Find groups" tab.
- **Process:** `name` and `brand` contain; `category` from the list; `privacy` is `public`, `private` or any; `minMembers` keeps groups with at least that many members. Paginated, newest first.
- **Output:** `{groups,total,page,pages,filter}` with manager populated.

#### FR-052 View a group page

- **Input:** `GET /groups/:id`.
- **Process:** A private group's page is shown only to its members, its manager and site admins; anybody else gets a 403 error page "This group is private."
- **Output:** The group page (SCR-071) with description, members, upcoming events of the group, join/leave button, and for the manager the pending requests and member management.

#### FR-053 Join a group

- **Input:** `POST /api/groups/:id/join`.
- **Process:** Already a member: `409 "You are already a member."`. Public group: added immediately. Private group: added to `pendingRequests` (`409 "Your request is already waiting for approval."` on repeat).
- **Output:** `{ok:true, joined:true}` or `{ok:true, pending:true, message:"Request sent to the group manager."}`.

#### FR-054 Leave a group

- **Input:** `POST /api/groups/:id/leave`.
- **Process:** The manager cannot leave (`400 "The manager cannot leave their own group."`). Otherwise the member is removed.
- **Output:** `{ok:true}`.

#### FR-055 Approve or reject a join request

- **Input:** `POST /api/groups/:id/approve {userId}`, `POST /api/groups/:id/reject {userId}`. Buttons on the group page, manager only.
- **Process:** Manager or site admin only (`403 "Only the group manager can do that."`). `userId` must be a valid id (`400 "Invalid member id"`). Approve: `404 "No pending request from that member."` if none; otherwise move from pending to members.
- **Output:** `{ok:true}`; the request row disappears, the member count updates.

#### FR-056 Remove a member

- **Input:** `POST /api/groups/:id/remove-member {userId}`.
- **Process:** Manager or site admin only. The manager cannot be removed (`400 "The manager cannot be removed."`).
- **Output:** `{ok:true}`.

#### FR-057 Edit a group; FR-058 Delete a group

- **Input:** `PUT /api/groups/:id`, `DELETE /api/groups/:id`.
- **Process:** Manager or site admin only. Deleting a group also deletes the events hosted under it.
- **Output:** `{ok:true, group}` / `{ok:true}`.

### 4.7 Feed

#### FR-060 Personal feed

- **Input:** `GET /api/feed?filter=all|friends|groups&page&limit`. Tabs on `/feed`: Everything, Friends, My groups.
- **Process:** Events whose host is the member or a friend, or whose group the member belongs to; available listings whose seller is the member or a friend. Events of private groups the member is not in are excluded even when a friend hosts them (BR-030). Events and listings are merged and sorted newest first. Each item carries the poster's first car (`car`) so the card can say "drives a 1989 BMW M3 E30". Page size 12, maximum 40.
- **Output:** `{items:[{kind:"event"|"listing", data, car}], total, page, hasMore, circle:{friends, groups}}`. A card shows the poster's avatar (link to profile), name, city, car, the time posted, then the event or listing summary. "Load more" appears when `hasMore` is true. An empty feed explains that the member has no friends or groups yet.

### 4.8 Search page

#### FR-070 Search page

- **Input:** `GET /search`.
- **Output:** Three tabs: the area map (FR-033 / FR-043 with a "Looking for" switch), Find members (FR-012), Find groups (FR-051).

#### FR-071 Canvas map

- **Description:** A React component draws Israel on a `<canvas>` from stored coordinates: the real border (Natural Earth), the neighbouring countries, the Sea of Galilee and the Dead Sea, and the cities from the list (major ones labelled).
- **Process:** Each click adds a vertex; the polygon closes visually after 3 points; "Clear" removes it; "Search this area" sends the vertices as longitude/latitude to FR-033 or FR-043. Results are drawn as markers on the map and listed beside it.
- **Output:** Works fully offline. No map provider is contacted.

### 4.9 Chat

#### FR-080 Connect to chat

- **Input:** Opening `/chat` opens a Socket.io connection.
- **Process:** The socket reuses the Express session. A socket without a logged in session is refused with "You must be logged in to chat."; a session whose user was deleted is refused with "Your account no longer exists." The socket joins a room named after the member's id. Everyone else is told the member is online.
- **Output:** The chat page (SCR-080) with the conversation list and a member picker; `?to=<userId>` opens a conversation straight away (used by "Message seller").

#### FR-081 Send a message

- **Input:** Socket event `message:send {to, text}`.
- **Process:** Refuse empty text ("Write something first."), more than 1000 characters ("Message is too long."), no recipient ("No recipient."), sending to yourself ("You cannot message yourself."), a recipient that does not exist ("That member does not exist."). Save the message with `read:false`. Emit `message:new` to the recipient's room and to every tab of the sender.
- **Output:** The bubble appears instantly in both browsers; the conversation list updates.
- **Postconditions:** The message is in MongoDB.

#### FR-082 Load history and conversations

- **Input:** Socket `history:load {withUserId}`; `GET /api/messages/:userId` (page size 50, max 200); `GET /api/messages/conversations`.
- **Process:** Only messages where the member is sender or recipient. Loading a conversation marks its unread messages as read.
- **Output:** The messages in order; the conversation list with last message and unread count per person.

#### FR-083 Search messages

- **Input:** `GET /api/messages/search?keyword&withUser&dateFrom&dateTo&unreadOnly`. The form on `/chat` offers keyword, with whom, from date and to date; `unreadOnly` is available to API callers only.
- **Process:** Only the member's own conversations. `keyword` contains; `withUser` limits to one person; date range inclusive; `unreadOnly=true` keeps unread messages sent to the member.
- **Output:** `{messages,total,page,pages}`.

#### FR-084 Edit and delete a message

- **Input:** `PUT /api/messages/:id {text}`, `DELETE /api/messages/:id`.
- **Process:** Sender only (`403 "You can only edit your own messages."` / `"...delete..."`). Text 1..1000.
- **Output:** `{ok:true, message}` / `{ok:true}`.

#### FR-085 Typing indicator and presence

- **Input:** Socket `typing {to, typing}`; connection and disconnection.
- **Output:** The other side sees "typing…" while `typing` is true; every connected member sees online/offline dots update.

### 4.10 Statistics

#### FR-090 Statistics page

- **Input:** `GET /stats`, then `GET /api/stats/summary`, `/events-per-month`, `/cars-by-make`, `/listings-by-category`, `/events-by-city`, `/group-activity`. "Refresh" button.
- **Process:** Each endpoint runs a MongoDB aggregation at request time on the live collections. Cars by make returns the ten most common makes. Listings by category returns count and average price.
- **Output:** Counters (members, cars, events, listings, groups) and five D3 charts drawn from the responses. Adding a car and pressing Refresh changes the bars.

### 4.11 Administration

#### FR-095 Admin page

- **Input:** `GET /admin`, `GET /api/admin/overview`, `GET /api/admin/members?username&location&role`, `GET /api/admin/content`.
- **Process:** Site admin only. Overview gives totals and the newest members. Members search includes the role, which ordinary member search never shows. Content lists the newest events and listings with links.
- **Output:** The admin page (SCR-100).

#### FR-096 Change a member's role

- **Input:** `POST /api/admin/members/:id/role {role}`.
- **Process:** `role` must be `user` or `admin` (`400`). An admin cannot remove their own rights (`400 "You cannot remove your own administrator rights."`). Unknown member `404`.
- **Output:** `{ok:true, user}`.

### 4.12 Uploads and media

#### FR-100 Upload one image

- **Input:** `POST /api/upload` multipart field `image`. Used by the avatar, car, event cover and group cover pickers.
- **Process:** Accept only JPEG, PNG, GIF, WebP; at most 2 MB. Save under `/public/uploads` with a random 32-hex filename and a safe extension; the original filename is never used.
- **Output:** `201 {ok:true, url:"/uploads/<name>"}`. No file: `400 "No image was uploaded."`. Wrong type: `400 "Only JPG, PNG, GIF and WebP images are allowed."`. Too big: `400 "The uploaded file is too large (max 2MB)."`.

#### FR-101 Upload several images

- **Input:** `POST /api/upload/many` field `images`, up to 6 files. Used by listings.
- **Output:** `201 {ok:true, urls:[...]}`; same rules as FR-100.

#### FR-102 Upload a video clip

- **Input:** `POST /api/upload/video` field `video`, optional `title` (cut to 80 characters).
- **Process:** MP4, WebM or Ogg, at most 25 MB, one file. Saved under `/public/video` and appended to `clips.json`, the playlist the React player reads.
- **Output:** `201 {ok:true, url, clips}`.

### 4.13 Motorsport page

#### FR-110 Newest GT World video

- **Input:** `GET /motorsport`.
- **Process:** The server reads the GT World channel's RSS feed (no API key), walks it from the newest entry and takes the first one that is a normal video, not a Short (a Short's `/shorts/<id>` URL answers 200; a normal video's redirects to `/watch`). The chosen id and title are saved in the `settings` collection and reused; the feed is checked again only when the saved value is more than 3 days old. If YouTube cannot be reached, the last saved video is used; if there is none, `RECAP_YOUTUBE_ID` from the environment; if that is empty the page says it could not reach YouTube.
- **Output:** The page (SCR-110) with the embedded video, its title, a link to the channel, and the "Around the world" placeholder. The React player for the site's own clips exists in the component but is switched off on this page (`showClips:false`).

### 4.14 Demo data

#### FR-120 Seed

- **Input:** `npm run seed` (replaces all data) or `npm run seed -- keep` (adds without clearing).
- **Output:** 12 members (password `secret123`, `alon` is a site admin) each with an avatar, friendships and pending requests, 7 groups (some private, with pending requests), 24 cars with photos, 17 events (6 races with a circuit and laps), 18 listings (15 with photos, some sold), 18 chat messages.

---

## 5. Non-functional requirements

### 5.1 Performance

| Id | Requirement | How to test |
|---|---|---|
| NFR-001 | Any list or search endpoint returns at most 50 records per page (feed 40, chat history 200), regardless of the `limit` asked for. | Call `/api/cars?limit=9999` and count the result. |
| NFR-002 | Area searches return at most 100 results. | Draw a polygon around the whole country. |
| NFR-003 | With the seed data on a local machine every page renders and its Ajax calls complete within 2 seconds. Statistics aggregations complete within 2 seconds. | Browser network tab. |
| NFR-004 | Chat messages are delivered to the recipient's open tabs within 1 second of sending on a local network. | Two browsers side by side. |
| NFR-005 | The Motorsport page contacts YouTube at most once per 3 days (plus one HEAD request per feed entry it checks), never on every visit. | Reload the page several times; the server logs one `[recap]` line. |

### 5.2 Security

| Id | Requirement | How to test |
|---|---|---|
| NFR-010 | Passwords are stored only as bcrypt hashes and are never returned by any endpoint. | Inspect the `users` collection; call `/api/users/:id`. |
| NFR-011 | Log in gives the same error for a wrong username and a wrong password. | Try both. |
| NFR-012 | The session cookie is `httpOnly`, expires after 7 days, and is `secure` when the site is served over https (production). | Browser dev tools, Application tab. |
| NFR-013 | Every non-public route checks the session server side. Removing the cookie makes any `/api` call answer 401 and any page redirect to `/login`. | curl without a cookie. |
| NFR-014 | Ownership checks are done on the server: a member cannot edit or delete another member's car, event, listing, message, profile or group, even by calling the API directly. | curl with member A's cookie against member B's record: 403. |
| NFR-015 | Private group content is hidden from non-members in every path: the group page, event list, event search and area search. | Test suite "private group leak" cases. |
| NFR-016 | A member can read only conversations they take part in. | Log in as a third member and request `/api/messages/<a>` : empty. |
| NFR-017 | Uploaded files are renamed to random names; the client's filename is never written to disk. Only listed image and video MIME types are accepted, with size limits. | Upload `../../x.jpg`, a `.exe`, a 3 MB image. |
| NFR-018 | All user text is HTML-escaped before it is placed in the page by jQuery (`UI.escape`) and by EJS (`<%= %>`). | Post a comment containing `<script>`. |
| NFR-019 | Text used in searches is regex-escaped so input like `(` or `c++` cannot break or slow the query. | Search for `(`. |

### 5.3 Reliability

| Id | Requirement | How to test |
|---|---|---|
| NFR-020 | The server never crashes on bad input. Every controller catches errors and passes them to the central error handler; malformed ids, unknown routes, schema violations, duplicate keys and oversized uploads all produce a proper 4xx response. | The test suite sends broken ids, bodies and files and checks the server is still healthy afterwards. |
| NFR-021 | Sessions survive a server restart (stored in MongoDB). | Restart, reload: still logged in. |
| NFR-022 | Deleting a member, a group or an event leaves no orphaned references that break another page. | Delete a member who hosts events and manages a group; open the feed, events and groups pages. |
| NFR-023 | The automated test suite (`npm test`, 102 checks across API and chat) passes against a running server. | `npm test`. |

### 5.4 Usability

| Id | Requirement |
|---|---|
| NFR-030 | Every create, edit, delete, like, attend, join and search action happens with Ajax and updates the page in place. No form causes a full page reload. |
| NFR-031 | Every form validates in the browser before sending and shows the message in the form's error box; the server repeats every check and its message is shown in the same box (or in a toast for actions that have no form) if the client check was bypassed. |
| NFR-032 | Destructive actions (delete car, event, listing, group, account, message) ask for confirmation. |
| NFR-033 | The layout adapts to narrow screens (CSS breakpoints at 900, 760 and 700 px) so pages remain usable in a phone browser. |
| NFR-034 | Every page has the same navigation bar; the current member's avatar and name are always visible; the Admin link appears only for admins. |
| NFR-035 | Empty states explain what to do (empty feed, empty garage, no search results, no clips). |

### 5.5 Compatibility and environment

| Id | Requirement |
|---|---|
| NFR-040 | Works in current Chrome, Edge and Firefox on Windows, macOS and Android. No build step; React components are compiled in the browser by Babel. |
| NFR-041 | Works with no internet connection except for two features: the YouTube embed and the GT World feed check. All libraries (jQuery, React, Babel, D3, Socket.io client) are served from `/public/vendor`. |
| NFR-042 | Runs on Node.js 18 or newer (uses the built in `fetch`) with MongoDB 6 or newer, locally or on MongoDB Atlas. |
| NFR-043 | Configuration comes only from environment variables: `MONGO_URI`, `SESSION_SECRET`, `PORT`, `NODE_ENV`, `RECAP_YOUTUBE_ID`. |
| NFR-044 | The production copy runs on Render (free tier) from `render.yaml`, deploying automatically from the `main` branch. |

### 5.6 Maintainability

| Id | Requirement |
|---|---|
| NFR-050 | Strict MVC: models in `src/models`, controllers in `src/controllers`, routes in `src/routes`, views in `views`. Validation rules live next to the route they protect. |
| NFR-051 | Every file carries plain language comments explaining what it does and why. |
| NFR-052 | This SRS is updated in the same commit as any change in behaviour. |

---

## 6. Screens and UI

All pages share the header (brand, navigation, current member, Log out) and the footer. Colours are defined as CSS variables; the theme is dark with a red accent.

| Id | Route | Screen | What is on it | Leads to |
|---|---|---|---|---|
| SCR-001 | `/` | Landing | Pitch, "Join Maslul", "Sign in". Logged in members are redirected to the feed. | SCR-002, SCR-003 |
| SCR-002 | `/register` | Create account | Username, password, display name, location, bio; error box under the form. | Feed on success |
| SCR-003 | `/login` | Sign in | Username, password. | Feed on success |
| SCR-010 | `/feed` | Feed | Tabs Everything / Friends / My groups; cards with poster avatar, name, city, car, time; "Load more". Sidebar: Your groups, People you might know with Add buttons. | Event, listing, profile pages |
| SCR-040 | `/events` | Meets & races | Tabs Upcoming / Going / Mine / Past; Create panel (type switch shows race format, circuit and laps with live total distance); Search panel with keyword, type, format, city, dates, include past. Cards with badge, date, city, host, going count, Attend button, Edit/Delete for host. | SCR-041 |
| SCR-041 | `/events/:id` | Event page | Cover, title, badge, when, host, group, address, description; attendees; Attend, Like; comments with delete; for a race: the circuit canvas with the animated car and the stats row (length per lap, laps, total, format). | Profile, group |
| SCR-050 | `/market` | Marketplace | Search panel (keyword, category, condition, city, min/max price, make, sort); tabs Everything for sale / My listings; Sell panel with up to 6 photos; cards with photo, category badge, price, condition, city, Sold badge. | SCR-051 |
| SCR-051 | `/market/:id` | Listing page | Photos, price, condition, city, description, seller card with "Message seller", Like, comments; seller sees Edit, Mark sold, Delete. | Chat |
| SCR-060 | `/search` | Search | Tabs: Draw area (canvas map, Looking for switch, Clear, Search this area, results list), Find members (username, location, keyword, car make), Find groups (name, category, brand, privacy, minimum members). | Profile, group, event, listing |
| SCR-070 | `/groups` | Groups | Search panel; tabs All / Mine; Create panel with private switch; cards with cover, category, brand, member count, Join/Leave/Pending. | SCR-071 |
| SCR-071 | `/groups/:id` | Group page | Cover, description, manager, members; upcoming events of the group; manager tools: pending requests (Approve/Reject), remove member, Edit, Delete. Private groups show a 403 page to outsiders. | Event pages |
| SCR-080 | `/chat` | Chat | Conversation list with unread counts and presence dots; member picker; message thread with typing indicator; edit/delete own messages; message search (keyword, with whom, from date, to date). | |
| SCR-090 | `/profile/:username` | Profile | Avatar, name, location, bio, counts (cars, events, listings), groups; Add friend / Request sent / Unfriend; the member's cars; for own profile: edit form with avatar upload and password change, Delete account. | Garage, groups |
| SCR-091 | `/garage` | Garage | Tabs My garage / Community garage; add and edit form with photo; community search (make, model, body type, colour, year range, hp range). | Profile |
| SCR-095 | `/stats` | Stats | Five counters; five D3 charts: events per month, cars by make, listings by category (with average price), events by city, group activity; Refresh. | |
| SCR-100 | `/admin` | Admin | Overview totals and newest members; member search with role filter and role switch; newest content. Admins only. | Profile, event, listing |
| SCR-110 | `/motorsport` | Motorsport worldwide | Race recaps: "Latest from GT World" embedded video with title and channel link; Around the world: "Coming soon" placeholder. | |
| SCR-120 | any | Error page | Title and message for 400, 403, 404 and 500 when the request was a page. | |

Navigation: Feed, Meets & races, Market, Motorsport, Search, Groups, Garage, Chat, Stats, Admin (admins only), then the member's avatar/name (to their profile) and Log out.

---

## 7. Business rules

| Id | Rule | Where enforced |
|---|---|---|
| BR-001 | Usernames are unique and case-insensitive (`Alon` and `alon` are the same account). | Register, login |
| BR-002 | A new account is always a plain member. Only an existing admin can grant admin. | Register, FR-096 |
| BR-003 | An admin cannot remove their own admin rights. | FR-096 |
| BR-004 | A member can edit or delete only their own profile, cars, events, listings and messages. Site admins can edit or delete any profile, car, event, listing or group, but not other people's chat messages. | Controllers |
| BR-005 | Deleting an account deletes everything the member created except their chat messages, and deletes the groups they manage with those groups' events. | FR-014 |
| BR-010 | You cannot befriend yourself; a request cannot be sent twice; friendship is always mutual. | FR-015, FR-016 |
| BR-020 | Every event and listing is tied to a city from the built in list; the coordinates stored are the city's coordinates. | Create/update |
| BR-021 | The host of an event always attends it and cannot cancel their own attendance. | FR-030, FR-037 |
| BR-022 | An event with `maxAttendees` greater than 0 refuses new attendees once full. 0 means unlimited. | FR-037 |
| BR-023 | Only a race has a race format, a circuit and laps. Changing an event to a meet clears them. | FR-030, FR-035 |
| BR-024 | A circuit can be chosen only from the library, and the form offers only circuits that suit the chosen race format. Total distance = circuit length × laps. | Events form, VAL-038 |
| BR-025 | Hosting an event on behalf of a group requires being a member or the manager of that group. | FR-030 |
| BR-026 | By default lists and searches show only upcoming events. Past events are shown only when asked for. | FR-031, FR-032 |
| BR-030 | Content of a private group (its page and its events) is visible only to its members, its manager and site admins, in every list, search, area search and feed. | Event controller, feed, group page |
| BR-031 | Joining a public group is immediate; joining a private group requires the manager's approval. | FR-053 |
| BR-032 | A group manager cannot leave or be removed from their own group. | FR-054, FR-056 |
| BR-033 | Group names are unique. | FR-050 |
| BR-034 | Deleting a group deletes its events. | FR-058 |
| BR-040 | A sold listing is hidden from the public market and from area search, but remains visible to its seller and when "include sold" is asked for. | FR-041 to FR-047 |
| BR-041 | A listing has at most 6 photos. | FR-040, FR-045 |
| BR-050 | Chat is one to one. A member cannot message themselves. Only the two participants can read a conversation. | FR-081, FR-082 |
| BR-051 | Opening a conversation marks the messages sent to you in it as read. | FR-082 |
| BR-060 | The feed shows only content from the member's circle: themselves, friends, and the groups they belong to. | FR-060 |
| BR-061 | People you might know never suggests yourself, a friend, or somebody you already asked. | FR-018 |
| BR-070 | The Motorsport video is the newest non-Short upload on the GT World channel, re-checked no more often than every 3 days. | FR-110 |
| BR-080 | Uploaded files are stored under a random name; the original name is discarded. | FR-100 to FR-102 |

---

## 8. Validation and input checks

Validation runs twice: in the browser (jQuery, message shown next to the field, request not sent) and on the server (express-validator on the route, then the Mongoose schema). A request that bypasses the browser gets `400` with the same message. The server messages below are exact.

### 8.1 Accounts

| Id | Field | Rule | Message |
|---|---|---|---|
| VAL-001 | username | required, 3 to 20 characters | Username must be 3-20 characters |
| VAL-002 | username | letters, digits and underscore only | Username may only contain letters, numbers and underscore |
| VAL-003 | password | 6 to 100 characters | Password must be at least 6 characters |
| VAL-004 | displayName | at most 40 characters | Display name is too long |
| VAL-005 | location / bio | at most 60 / 300 characters | Location is too long / Bio is too long |
| VAL-006 | login username, password | not empty | Username is required / Password is required |
| VAL-007 | newPassword (profile) | at least 6 characters | New password must be at least 6 characters |
| VAL-008 | currentPassword (profile) | must match, unless admin | Your current password is incorrect. (401) |

### 8.2 Cars

| Id | Field | Rule | Message |
|---|---|---|---|
| VAL-020 | make | required, at most 40 | Make is required / Make is too long |
| VAL-021 | model | required, at most 40 | Model is required / Model is too long |
| VAL-022 | year | integer 1900 to next year | Year must be a real year |
| VAL-023 | horsepower | optional integer 0 to 2000 | Horsepower must be between 0 and 2000 |
| VAL-024 | category | optional, one of Sedan, Hatchback, SUV, Coupe, Convertible, Pickup, Van, Other | Unknown body type |
| VAL-025 | color | optional, at most 30 | Color is too long |
| VAL-026 | engine | optional, at most 40 | Engine text is too long |
| VAL-027 | description | optional, at most 500 | Description is too long |

### 8.3 Events

| Id | Field | Rule | Message |
|---|---|---|---|
| VAL-030 | title | required, 3 to 80 | Title is required / Title must be 3-80 characters |
| VAL-031 | description | optional, at most 1000 | Description is too long |
| VAL-032 | type | `meet` or `race` | Choose meet or race |
| VAL-033 | raceType | optional, one of Drag, Track, Rally, Hillclimb, Drift, Time attack | Unknown race type |
| VAL-034 | city | one of the 37 cities in the list | Pick a city from the list |
| VAL-035 | address | optional, at most 120 | Address is too long |
| VAL-036 | startsAt | valid ISO 8601 date-time | Pick a valid date and time |
| VAL-037 | maxAttendees | optional integer 0 to 10000 | Attendee limit must be a sensible number |
| VAL-038 | circuit | optional, one of the circuit ids in the library | Pick a circuit from the list |
| VAL-039 | laps | optional integer 1 to 500 | Laps must be between 1 and 500 |

### 8.4 Listings

| Id | Field | Rule | Message |
|---|---|---|---|
| VAL-040 | title | required, 3 to 80 | Title is required / Title must be 3-80 characters |
| VAL-041 | description | optional, at most 1000 | Description is too long |
| VAL-042 | price | number 0 to 10,000,000 | Price must be a real amount |
| VAL-043 | category | one of Whole car, Engine & drivetrain, Wheels & tires, Body & exterior, Interior, Audio & electronics, Tools, Other parts | Pick a category |
| VAL-044 | condition | optional, one of New, Like new, Used, For parts | Unknown condition |
| VAL-045 | city | from the list | Pick a city from the list |
| VAL-046 | year | optional integer 1900 to next year | Year must be a real year |
| VAL-047 | make / model | optional, at most 40 each | Make is too long / Model is too long |
| VAL-048 | photos | at most 6 URLs | (extra photos are dropped) |

### 8.5 Groups

| Id | Field | Rule | Message |
|---|---|---|---|
| VAL-050 | name | required, 2 to 50, unique | Group name is required / Group name must be 2-50 characters / That name is already taken. (409) |
| VAL-051 | description | optional, at most 500 | Description is too long |
| VAL-052 | category | optional, one of Brand, Off-road, Classic, EV, Racing, Tuning, JDM, General | Unknown category |
| VAL-053 | brand | optional, at most 40 | Brand is too long |
| VAL-054 | userId (approve/reject/remove) | valid MongoDB id | Invalid member id |

### 8.6 Chat, comments, admin, ids, uploads, polygons

| Id | Field | Rule | Message |
|---|---|---|---|
| VAL-090 | comment text | required, at most 500 | Comment cannot be empty / Comment is too long |
| VAL-091 | message text (HTTP edit) | required, at most 1000 | Message cannot be empty / Message is too long |
| VAL-092 | message text (socket) | not blank, at most 1000, recipient given, not self, recipient exists | Write something first. / Message is too long. / No recipient. / You cannot message yourself. / That member does not exist. |
| VAL-093 | role | `user` or `admin` | Role must be "user" or "admin" |
| VAL-094 | any `:id` in a URL | 24 hex characters | Invalid id. |
| VAL-095 | image upload | JPEG, PNG, GIF or WebP; at most 2 MB; at most 6 files | Only JPG, PNG, GIF and WebP images are allowed. / The uploaded file is too large (max 2MB). / No image was uploaded. |
| VAL-096 | video upload | MP4, WebM or Ogg; at most 25 MB; one file | Only MP4, WebM and Ogg video files are allowed. / No video was uploaded. |
| VAL-097 | polygon | array of at least 3 `[lng,lat]` pairs, each numeric, lng −180..180, lat −90..90 | Draw an area with at least three points. / Bad point / Point is outside the world |
| VAL-098 | page, limit | integers; page ≥ 1; limit clamped to 1..50 (feed 1..40, history 1..200) | (silently corrected) |
| VAL-099 | search filters | invalid enum values, non-numeric ranges and unknown cities are ignored rather than rejected | (no error, filter skipped) |

---

## 9. Error handling

### 9.1 How errors are answered

| Id | Situation | Ajax / `/api` response | Page response |
|---|---|---|---|
| ERR-001 | Validation rule failed | `400 {error: <first message>, errors:[{field,message}...]}` | 400 error page listing the messages |
| ERR-002 | Malformed id in the URL | `400 {error:"Invalid id."}` | same JSON |
| ERR-003 | Mongoose schema rule failed (request bypassed the route rules) | `400 {error: <schema message>}` | 400 error page |
| ERR-004 | Value could not be cast (e.g. a bad id in a query string) | `400 {error:"Invalid value provided."}` | 400 error page |
| ERR-005 | Not logged in | `401 {error:"You must be logged in to do that."}` | redirect to `/login` |
| ERR-006 | Wrong credentials | `401 {error:"Incorrect username or password."}` | n/a |
| ERR-007 | Not allowed (not owner, not manager, private group, not admin) | `403 {error: <specific message>}` | 403 error page |
| ERR-008 | Record or route not found | `404 {error:"... not found."}` / `{error:"Not found."}` | 404 error page "The page you were looking for does not exist." |
| ERR-009 | Duplicate unique value (username, group name) | `409 {error:"That <field> is already taken."}` | 409 error page |
| ERR-010 | State conflict (already friends, already member, event full, request pending) | `409 {error: <specific message>}` | n/a |
| ERR-011 | Upload too large | `400 {error:"The uploaded file is too large (max 2MB)."}` | 400 error page |
| ERR-012 | Anything unexpected | `500 {error:"Something went wrong. Please try again."}`, details only in the server log | 500 error page with the same message |
| ERR-013 | Socket connection without a session | Connection refused with `connect_error` "You must be logged in to chat." | n/a |
| ERR-014 | Socket action failed | The acknowledgement carries `{error: message}`; nothing is broadcast | n/a |
| ERR-015 | Database unreachable at start-up | The process logs the error and exits with a non-zero code instead of serving pages without data | n/a |
| ERR-016 | YouTube unreachable for the recap | Logged as `[recap] could not check YouTube`, the last saved video or the fallback is shown, the page still renders | n/a |

### 9.2 How the browser shows them

- The browser reads `error` from the JSON body (`API.errorMessage`). If the server cannot be reached at all the message is "Cannot reach the server. Check your connection."; if the body has no message, "Something went wrong. Please try again."
- A `400` from a form is shown in that form's error box (for example `#event-error`, `#register-error`). List panels that fail to load show the message in place of the list.
- `401`, `403`, `404`, `409` and `500` from a button action are shown in a toast at the bottom of the screen; the page stays as it was. A page request without a session is redirected to `/login` by the server.
- Failed chat actions show the acknowledgement's error in the thread area.
- The server never crashes: every controller wraps its body in try/catch and passes errors to the central handler (`src/middleware/error.js`).

---

## 10. Assumptions and limitations

| Id | Assumption or limitation |
|---|---|
| A-001 | The system is used from a modern browser with JavaScript enabled. Without JavaScript nothing beyond the landing, login and register pages works, because all data loads with Ajax. |
| A-002 | Members are honest about who they are. There is no email verification, no CAPTCHA, no rate limiting on login. |
| A-003 | Password recovery is not offered. A forgotten password requires a site admin to set a new one through the profile edit (admins skip the current password check). |
| A-004 | Locations are city-level only. Events and listings are pinned to the coordinates of the chosen city, not to the street address. The address is free text for humans. |
| A-005 | The list of cities (37) and the circuit library (8) are fixed in the code. Adding one is a code change. |
| A-006 | The circuit layouts are schematic drawings, not surveyed tracks. |
| A-007 | Uploaded files live on the server's disk. On the hosted free tier (Render) the disk is wiped on every deploy or restart, so member uploads there do not persist; seeded photos are part of the repository and always survive. |
| A-008 | The hosted copy sleeps after 15 minutes without traffic and takes about a minute to wake. |
| A-009 | The hosted copy and a local copy may share the same MongoDB Atlas database; seeding one changes the other. |
| A-010 | Internet is needed only for the YouTube embed and the GT World feed check. Everything else, including the map, works offline. |
| A-011 | The GT World channel id is fixed in the code. If the channel disappears, the page falls back to `RECAP_YOUTUBE_ID` or an explanatory message. |
| A-012 | Time is stored in UTC and displayed in the browser's local time. |
| A-013 | The interface language is English; member content can be in any language, including Hebrew. |
| A-014 | Chat has no group conversations, no attachments and no push notifications; a member sees new messages only while the chat page is open, plus unread counts when they next open it. |
| A-015 | Running the automated tests creates a few throwaway accounts and records in the database; `npm run seed` removes them. |
| A-016 | The "Around the world" section on the Motorsport page is a placeholder by design; the selection algorithm is future work. |

---

## Appendix A. Traceability to the code

| Area | Files |
|---|---|
| Accounts, sessions | `src/routes/auth.js`, `src/controllers/authController.js`, `src/middleware/auth.js`, `server.js` (session), `src/models/User.js` |
| Profiles, friends | `src/routes/users.js`, `src/controllers/userController.js`, `views/pages/profile.ejs`, `public/js/profile.js` |
| Cars | `src/routes/cars.js`, `src/controllers/carController.js`, `src/models/Car.js`, `views/pages/garage.ejs`, `public/js/garage.js` |
| Events, circuits | `src/routes/events.js`, `src/controllers/eventController.js`, `src/models/Event.js`, `src/data/circuits.js`, `src/data/cities.js`, `views/pages/events.ejs`, `views/pages/event.ejs`, `public/js/events.js`, `public/js/event-detail.js` |
| Listings | `src/routes/listings.js`, `src/controllers/listingController.js`, `src/models/Listing.js`, `views/pages/market.ejs`, `views/pages/listing.ejs`, `public/js/market.js`, `public/js/listing-detail.js` |
| Groups | `src/routes/groups.js`, `src/controllers/groupController.js`, `src/models/Group.js`, `views/pages/groups.ejs`, `views/pages/group.ejs`, `public/js/groups.js`, `public/js/group-detail.js` |
| Feed | `src/routes/feed.js`, `src/controllers/feedController.js`, `views/pages/feed.ejs`, `public/js/feed.js` |
| Search page, map | `src/routes/index.js`, `views/pages/search.ejs`, `public/js/search.js`, `public/components/CanvasMap.jsx`, `public/components/mapData.js` |
| Chat | `src/socket/chat.js`, `src/routes/messages.js`, `src/controllers/messageController.js`, `src/models/Message.js`, `views/pages/chat.ejs`, `public/js/chat.js` |
| Statistics | `src/routes/stats.js`, `src/controllers/statsController.js`, `views/pages/stats.ejs`, `public/js/stats.js` |
| Admin | `src/routes/admin.js`, `src/controllers/adminController.js`, `views/pages/admin.ejs`, `public/js/admin.js` |
| Uploads | `src/routes/uploads.js`, `src/middleware/upload.js` |
| Motorsport, recap | `src/routes/index.js`, `src/utils/recap.js`, `src/models/Setting.js`, `views/pages/motorsport.ejs`, `public/components/VideoShowcase.jsx` |
| Validation, errors | `src/middleware/validate.js`, `src/middleware/error.js`, `src/utils/query.js`, `src/utils/wantsJson.js` |
| Demo data | `seed/seed.js`, `public/img/cars/CREDITS.md` |
| Tests | `tests/api.test.js`, `tests/chat.test.js`, `tests/helpers.js` |

## Appendix B. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 17 Sep 2026 | First version, reverse engineered from commit `f01dd61`. Covers everything up to the real Israel map, circuits, Motorsport page with the GT World video, photos in the demo data and the enriched feed. |
