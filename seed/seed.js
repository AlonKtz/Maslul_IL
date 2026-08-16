/**
 * Seeds Maslul with enough content to look like a real network.
 *
 *   npm run seed          add the demo data (clears what is there first)
 *   npm run seed -- keep  add it without clearing
 *
 * Every member's password is "secret123". The site administrator is "alon".
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Event = require('../src/models/Event');
const Listing = require('../src/models/Listing');
const Car = require('../src/models/Car');
const Message = require('../src/models/Message');
const { coordinatesOf } = require('../src/data/cities');

// ---------------------------------------------------------------- helpers
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const pickSome = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);
const between = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// A date n days from now (negative = in the past), at a given hour.
function daysFromNow(n, hour = 19) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, [0, 30][between(0, 1)], 0, 0);
  return d;
}

function point(city) {
  return { type: 'Point', coordinates: coordinatesOf(city) };
}

// ---------------------------------------------------------------- the data
const MEMBERS = [
  { username: 'alon', displayName: 'Alon Katz', location: 'Tel Aviv', role: 'admin',
    bio: 'Runs Maslul. Weekends belong to the E30.' },
  { username: 'noa', displayName: 'Noa Bar', location: 'Haifa',
    bio: 'Track days and cold brews. Time attack regular.' },
  { username: 'yossi', displayName: 'Yossi Mizrahi', location: 'Beer Sheva',
    bio: 'Desert runs, lockers and recovery gear.' },
  { username: 'dana', displayName: 'Dana Levi', location: 'Ramat Gan',
    bio: 'EV convert. Still misses the noise.' },
  { username: 'itai', displayName: 'Itai Cohen', location: 'Netanya',
    bio: 'JDM only. 2JZ or nothing.' },
  { username: 'maya', displayName: 'Maya Shalev', location: 'Jerusalem',
    bio: 'Classic Alfas and stubborn carburettors.' },
  { username: 'omer', displayName: 'Omer Peretz', location: 'Ashdod',
    bio: 'Drift practice most Fridays. Bring tyres.' },
  { username: 'tamar', displayName: 'Tamar Golan', location: 'Herzliya',
    bio: 'Detailer by trade, hoarder of polish.' },
  { username: 'eitan', displayName: 'Eitan Rosen', location: 'Rishon LeZion',
    bio: 'Drag racing. Numbers or it did not happen.' },
  { username: 'shira', displayName: 'Shira Adler', location: 'Modiin',
    bio: 'Sunday morning canyon drives.' },
  { username: 'gil', displayName: 'Gil Avraham', location: 'Eilat',
    bio: 'Southern routes and long convoys.' },
  { username: 'roni', displayName: 'Roni Katz', location: 'Kfar Saba',
    bio: 'Wrenching on a budget. Parts always wanted.' },
];

const GROUPS = [
  { name: 'BMW Israel', category: 'Brand', brand: 'BMW',
    description: 'Everything from the E30 to the current cars. Meets, technical help and parts.' },
  { name: 'JDM Israel', category: 'JDM', brand: 'Toyota',
    description: 'Japanese cars of every era. Supras, Skylines, Silvias and the daily Civics too.' },
  { name: 'Negev Off-road', category: 'Off-road', brand: 'Land Rover',
    description: 'Desert routes, recovery practice and convoys every month.' },
  { name: 'Classic Cars IL', category: 'Classic', brand: '',
    description: 'Anything over thirty years old and still moving under its own power.' },
  { name: 'EV Drivers IL', category: 'EV', brand: 'Tesla',
    description: 'Charging maps, road trips and range arguments.' },
  { name: 'Drift Collective', category: 'Racing', brand: 'Nissan',
    description: 'Practice days, tyre orders and seat time. Private — we approve members.',
    isPrivate: true },
  { name: 'Tuning Garage', category: 'Tuning', brand: '',
    description: 'Maps, dynos and honest dyno graphs.' },
];

const CARS = [
  { make: 'BMW', model: 'M3 E30', year: 1989, category: 'Coupe', engine: 'S14 2.3', horsepower: 195, color: 'Alpine White' },
  { make: 'BMW', model: 'M340i', year: 2021, category: 'Sedan', engine: 'B58 3.0T', horsepower: 374, color: 'Portimao Blue' },
  { make: 'BMW', model: '325i E36', year: 1995, category: 'Coupe', engine: 'M50B25', horsepower: 189, color: 'Boston Green' },
  { make: 'Toyota', model: 'Supra MK4', year: 1997, category: 'Coupe', engine: '2JZ-GTE', horsepower: 320, color: 'Renaissance Red' },
  { make: 'Toyota', model: 'GR86', year: 2023, category: 'Coupe', engine: 'FA24', horsepower: 234, color: 'Track Red' },
  { make: 'Toyota', model: 'Land Cruiser 78', year: 2004, category: 'SUV', engine: '1HZ 4.2 diesel', horsepower: 129, color: 'Sand' },
  { make: 'Nissan', model: 'Skyline R34 GT-T', year: 1999, category: 'Coupe', engine: 'RB25DET', horsepower: 280, color: 'Bayside Blue' },
  { make: 'Nissan', model: 'Silvia S15', year: 2000, category: 'Coupe', engine: 'SR20DET', horsepower: 250, color: 'Pearl White' },
  { make: 'Nissan', model: 'Patrol Y61', year: 2006, category: 'SUV', engine: 'ZD30', horsepower: 158, color: 'Silver' },
  { make: 'Mazda', model: 'MX-5 NA', year: 1994, category: 'Convertible', engine: 'B6ZE 1.6', horsepower: 115, color: 'Classic Red' },
  { make: 'Mazda', model: 'RX-7 FD', year: 1993, category: 'Coupe', engine: '13B-REW', horsepower: 276, color: 'Montego Blue' },
  { make: 'Honda', model: 'Civic Type R FK8', year: 2019, category: 'Hatchback', engine: 'K20C1', horsepower: 320, color: 'Championship White' },
  { make: 'Honda', model: 'S2000', year: 2004, category: 'Convertible', engine: 'F20C', horsepower: 240, color: 'Berlina Black' },
  { make: 'Subaru', model: 'Impreza WRX STI', year: 2006, category: 'Sedan', engine: 'EJ257', horsepower: 280, color: 'World Rally Blue' },
  { make: 'Volkswagen', model: 'Golf GTI Mk7', year: 2017, category: 'Hatchback', engine: 'EA888 2.0T', horsepower: 227, color: 'Tornado Red' },
  { make: 'Volkswagen', model: 'Beetle', year: 1971, category: 'Coupe', engine: '1.6 flat four', horsepower: 60, color: 'Marina Blue' },
  { make: 'Tesla', model: 'Model 3 Performance', year: 2022, category: 'Sedan', engine: 'Dual motor', horsepower: 510, color: 'Deep Blue' },
  { make: 'Tesla', model: 'Model Y', year: 2023, category: 'SUV', engine: 'Long range', horsepower: 384, color: 'Pearl White' },
  { make: 'Alfa Romeo', model: 'Giulia Super', year: 1972, category: 'Sedan', engine: '1.6 twin cam', horsepower: 102, color: 'Rosso' },
  { make: 'Porsche', model: '944', year: 1986, category: 'Coupe', engine: '2.5 inline four', horsepower: 160, color: 'Guards Red' },
  { make: 'Ford', model: 'Mustang GT', year: 2018, category: 'Coupe', engine: 'Coyote 5.0', horsepower: 450, color: 'Race Red' },
  { make: 'Land Rover', model: 'Defender 90', year: 1998, category: 'SUV', engine: '300Tdi', horsepower: 111, color: 'Coniston Green' },
  { make: 'Jeep', model: 'Wrangler JK', year: 2012, category: 'SUV', engine: '3.6 Pentastar', horsepower: 285, color: 'Black' },
  { make: 'Mitsubishi', model: 'Lancer Evo IX', year: 2006, category: 'Sedan', engine: '4G63T', horsepower: 286, color: 'Rally Red' },
];

const EVENT_TEMPLATES = [
  { title: 'Friday night cruise', type: 'meet', city: 'Tel Aviv', address: 'Ha-Miflasim parking',
    description: 'Meet at nine, roll out at ten along the coast road. All cars welcome, keep it civil.' },
  { title: 'Haifa port meet', type: 'meet', city: 'Haifa', address: 'Port lot, gate 3',
    description: 'Monthly gathering by the water. Coffee from the truck at the corner.' },
  { title: 'Negev desert run', type: 'meet', city: 'Beer Sheva', address: 'Route 40 junction',
    description: 'Full day convoy. Bring recovery gear, a spare and more water than you think.' },
  { title: 'Sunday canyon drive', type: 'meet', city: 'Jerusalem', address: 'Ein Kerem car park',
    description: 'Early start, twisty roads, breakfast at the end.' },
  { title: 'Cars and coffee', type: 'meet', city: 'Herzliya', address: 'Marina lot',
    description: 'Relaxed morning meet. Park up, talk rubbish, go home by noon.' },
  { title: 'Classic breakfast run', type: 'meet', city: 'Netanya', address: 'Seafront promenade',
    description: 'Pre-1995 cars preferred but nobody is turned away.' },
  { title: 'EV road trip north', type: 'meet', city: 'Tiberias', address: 'Lakeside charger',
    description: 'Charging stops planned, route shared the day before.' },
  { title: 'Drag night', type: 'race', raceType: 'Drag', city: 'Rishon LeZion', address: 'Industrial zone strip',
    description: 'Timed runs. Helmets required, tech check at the gate.' },
  { title: 'Time attack round', type: 'race', raceType: 'Time attack', city: 'Ashdod', address: 'Circuit south paddock',
    description: 'Three sessions, timing transponders provided.' },
  { title: 'Drift practice', type: 'race', raceType: 'Drift', city: 'Ashkelon', address: 'Skid pad',
    description: 'Open practice. Bring at least two sets of rear tyres.' },
  { title: 'Hill climb', type: 'race', raceType: 'Hillclimb', city: 'Safed', address: 'Mountain road closure',
    description: 'Closed road, single car runs, marshals on every corner.' },
  { title: 'Rally sprint', type: 'race', raceType: 'Rally', city: 'Modiin', address: 'Forest service road',
    description: 'Gravel stage, co-driver mandatory.' },
  { title: 'Track day', type: 'race', raceType: 'Track', city: 'Eilat', address: 'Southern circuit',
    description: 'Novice and open groups. Instruction available for the first session.' },
];

const LISTINGS = [
  { title: 'BBS RS 16" set of four', price: 4200, category: 'Wheels & tires', condition: 'Used',
    description: 'Refurbished lips, straight, no cracks. 4x100.' },
  { title: 'Volk TE37 17" gunmetal', price: 8900, category: 'Wheels & tires', condition: 'Like new',
    description: 'Barely used, 5x114.3. Genuine, with centre caps.' },
  { title: 'Set of Michelin PS4S 245/40/18', price: 2600, category: 'Wheels & tires', condition: 'Used',
    description: 'About 60% left. Even wear, no repairs.' },
  { title: 'S14 SR20DET complete engine', price: 15500, category: 'Engine & drivetrain', condition: 'Used',
    description: 'Compression tested, comes with loom and ECU.' },
  { title: 'K-series short ram intake', price: 480, category: 'Engine & drivetrain', condition: 'Used',
    description: 'Fits FK8 and FK2. Filter included.' },
  { title: 'Coilover set, adjustable', price: 3400, category: 'Engine & drivetrain', condition: 'Like new',
    description: 'One season of road use. All keys and tools included.' },
  { title: 'E30 front bumper, original', price: 1200, category: 'Body & exterior', condition: 'Used',
    description: 'Straight, small scuff underneath. No cracks.' },
  { title: 'Carbon bonnet, universal fit', price: 2900, category: 'Body & exterior', condition: 'New',
    description: 'Never fitted, still wrapped. Pins included.' },
  { title: 'Bucket seat with rails', price: 1800, category: 'Interior', condition: 'Used',
    description: 'FIA date expired, fine for road and practice use.' },
  { title: 'Momo steering wheel 350mm', price: 650, category: 'Interior', condition: 'Used',
    description: 'Suede, some shine on the top. Boss kit not included.' },
  { title: 'Double din head unit with CarPlay', price: 950, category: 'Audio & electronics', condition: 'Like new',
    description: 'Removed when I sold the car. Harness included.' },
  { title: 'Dash cam, front and rear', price: 420, category: 'Audio & electronics', condition: 'New',
    description: 'Sealed box, hardwire kit included.' },
  { title: 'Trolley jack, 3 ton', price: 780, category: 'Tools', condition: 'Used',
    description: 'Low profile, holds pressure. Two axle stands included.' },
  { title: 'Torque wrench set', price: 540, category: 'Tools', condition: 'Like new',
    description: 'Calibrated last year, in the case.' },
  { title: 'Mazda MX-5 NA, running project', price: 34000, category: 'Whole car', condition: 'Used',
    make: 'Mazda', model: 'MX-5', year: 1994,
    description: 'Drives well, test passed. Some rust in the usual arches, honest car.' },
  { title: 'VW Golf Mk7 GTI', price: 98000, category: 'Whole car', condition: 'Used',
    make: 'Volkswagen', model: 'Golf', year: 2017,
    description: 'Full service history, second owner, stage one map with the original file saved.' },
  { title: 'Honda Civic EK, track prepared', price: 42000, category: 'Whole car', condition: 'For parts',
    make: 'Honda', model: 'Civic', year: 1998,
    description: 'Caged, no interior, sold as a track car only. Trailer collection.' },
  { title: 'Assorted E36 spares', price: 300, category: 'Other parts', condition: 'For parts',
    description: 'Box of trim, brackets and clips. Take the lot.' },
];

const CONVERSATIONS = [
  ['Are you bringing the Supra on Friday?', 'Planned to, if the weather holds.',
   'Forecast looks fine. We roll out at ten.', 'See you there.'],
  ['Is the wheel set still available?', 'It is. Where are you based?',
   'Haifa, I can collect on the weekend.', 'That works. I will hold them for you.'],
  ['Great turnout at the meet last night.', 'Best one this year I think.',
   'Same spot next month?', 'Same spot. I will post it this week.'],
  ['Do you have space in the convoy?', 'Two spots left, both yours if you want them.',
   'Perfect, count us in.'],
  ['What pressures do you run on track?', 'Start at 2.0 cold and let them come up to about 2.4.',
   'That is lower than I expected, thanks.'],
];

// ---------------------------------------------------------------- seeding
async function seed() {
  const keep = process.argv.includes('keep');

  await connectDB();

  if (!keep) {
    console.log('[seed] clearing existing data…');
    await Promise.all([
      User.deleteMany({}), Group.deleteMany({}), Event.deleteMany({}),
      Listing.deleteMany({}), Car.deleteMany({}), Message.deleteMany({}),
    ]);
  }

  // ---- members --------------------------------------------------------
  // Created one at a time so the password-hashing hook runs for each.
  const users = [];
  for (const member of MEMBERS) {
    users.push(await User.create(Object.assign({ password: 'secret123' }, member)));
  }
  console.log(`[seed] ${users.length} members`);

  // ---- friendships ----------------------------------------------------
  // Everybody gets between three and six friends, both ways.
  for (const user of users) {
    const others = users.filter((u) => !u._id.equals(user._id));
    for (const friend of pickSome(others, between(3, 6))) {
      if (!user.friends.some((f) => f.equals(friend._id))) {
        user.friends.push(friend._id);
        friend.friends.push(user._id);
      }
    }
  }
  // A couple of pending requests so the profile page has something to show.
  users[1].friendRequests.push(users[9]._id);
  users[2].friendRequests.push(users[10]._id);
  await Promise.all(users.map((u) => u.save()));
  console.log('[seed] friendships and a few pending requests');

  // ---- groups ---------------------------------------------------------
  const groups = [];
  for (let i = 0; i < GROUPS.length; i++) {
    const admin = users[i % users.length];
    const members = pickSome(users.filter((u) => !u._id.equals(admin._id)), between(4, 9));

    const group = await Group.create(Object.assign({}, GROUPS[i], {
      admin: admin._id,
      members: [admin._id, ...members.map((m) => m._id)],
      // The private group has somebody waiting to be let in.
      pendingRequests: GROUPS[i].isPrivate ? [users[11]._id] : [],
    }));
    groups.push(group);
  }
  console.log(`[seed] ${groups.length} groups`);

  // ---- cars -----------------------------------------------------------
  const cars = [];
  for (let i = 0; i < CARS.length; i++) {
    cars.push(await Car.create(Object.assign({}, CARS[i], {
      owner: users[i % users.length]._id,
      description: '',
    })));
  }
  console.log(`[seed] ${cars.length} cars`);

  // ---- events ---------------------------------------------------------
  // Spread across the last four months and the next two, so the "per month"
  // chart has a real shape.
  const events = [];
  const offsets = [-105, -92, -74, -61, -45, -33, -20, -12, -5, 3, 9, 16, 23, 30, 38, 47, 55];

  for (let i = 0; i < offsets.length; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const host = users[i % users.length];
    const attendees = pickSome(users.filter((u) => !u._id.equals(host._id)), between(3, 9));

    events.push(await Event.create({
      title: template.title,
      description: template.description,
      type: template.type,
      raceType: template.raceType || '',
      host: host._id,
      group: Math.random() > 0.35 ? pick(groups)._id : null,
      startsAt: daysFromNow(offsets[i], between(8, 21)),
      city: template.city,
      address: template.address,
      location: point(template.city),
      maxAttendees: Math.random() > 0.6 ? between(10, 40) : 0,
      attendees: [host._id, ...attendees.map((a) => a._id)],
      likes: pickSome(users, between(0, 7)).map((u) => u._id),
      comments: Math.random() > 0.5
        ? [{ author: pick(users)._id, text: pick([
            'Count me in.', 'Is there parking nearby?', 'Bringing a friend if that is fine.',
            'What time does it finish?', 'Been waiting for this one.',
          ]) }]
        : [],
    }));
  }
  console.log(`[seed] ${events.length} events`);

  // ---- listings -------------------------------------------------------
  const cities = ['Tel Aviv', 'Haifa', 'Beer Sheva', 'Netanya', 'Jerusalem', 'Ashdod', 'Herzliya', 'Modiin'];
  const listings = [];

  for (let i = 0; i < LISTINGS.length; i++) {
    const city = cities[i % cities.length];
    listings.push(await Listing.create(Object.assign({}, LISTINGS[i], {
      seller: users[(i + 3) % users.length]._id,
      city,
      location: point(city),
      // A couple of things have already sold.
      status: i % 9 === 0 ? 'sold' : 'available',
      likes: pickSome(users, between(0, 5)).map((u) => u._id),
      comments: Math.random() > 0.6
        ? [{ author: pick(users)._id, text: pick([
            'Is this still available?', 'Would you take less for a quick sale?',
            'Any photos of the back?', 'Can you post it?',
          ]) }]
        : [],
    })));
  }
  console.log(`[seed] ${listings.length} listings`);

  // ---- messages -------------------------------------------------------
  let messageCount = 0;
  for (let i = 0; i < CONVERSATIONS.length; i++) {
    const a = users[i];
    const b = users[(i + 1) % users.length];
    const lines = CONVERSATIONS[i];

    for (let j = 0; j < lines.length; j++) {
      await Message.create({
        from: j % 2 === 0 ? a._id : b._id,
        to: j % 2 === 0 ? b._id : a._id,
        text: lines[j],
        read: j < lines.length - 1,
        createdAt: daysFromNow(-between(1, 20), between(9, 22)),
      });
      messageCount++;
    }
  }
  console.log(`[seed] ${messageCount} chat messages`);

  // ---- done -----------------------------------------------------------
  console.log('\n  Seeding complete.');
  console.log('  Sign in with any of these — the password is always "secret123":');
  console.log('    alon   (site administrator)');
  console.log('    noa, yossi, dana, itai, maya, omer, tamar, eitan, shira, gil, roni\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
