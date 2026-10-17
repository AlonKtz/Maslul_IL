var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// config/db.jsx
var require_db = __commonJS({
  "config/db.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    async function connectDB2() {
      const uri = process.env.MONGO_URI;
      if (!uri) {
        console.error("[db] Missing MONGO_URI. Copy .env.example to .env and set it.");
        process.exit(1);
      }
      try {
        await mongoose2.connect(uri);
        console.log("[db] MongoDB connected");
        const started = Date.now();
        await mongoose2.connection.db.admin().ping();
        console.log(`[db] one round trip to the database takes ${Date.now() - started} ms`);
      } catch (err) {
        console.error("[db] MongoDB connection error:", err.message);
        process.exit(1);
      }
    }
    module2.exports = connectDB2;
  }
});

// src/models/User.jsx
var require_User = __commonJS({
  "src/models/User.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var bcrypt = require("bcryptjs");
    var userSchema = new mongoose2.Schema(
      {
        username: {
          type: String,
          required: [true, "Username is required"],
          unique: true,
          trim: true,
          lowercase: true,
          minlength: [3, "Username must be at least 3 characters"],
          maxlength: [20, "Username must be at most 20 characters"],
          match: [/^[a-z0-9_]+$/, "Username may only contain letters, numbers and underscore"]
        },
        displayName: {
          type: String,
          trim: true,
          maxlength: [40, "Display name is too long"]
        },
        password: {
          type: String,
          required: [true, "Password is required"],
          minlength: [6, "Password must be at least 6 characters"],
          select: false
          // keep the hash out of normal queries
        },
        // role for the whole site. being admin of one group is separate, that is Group.admin
        role: {
          type: String,
          enum: ["user", "admin"],
          default: "user"
        },
        bio: { type: String, maxlength: [300, "Bio is too long"], default: "" },
        avatar: { type: String, default: "/img/default-avatar.svg" },
        location: { type: String, maxlength: [60, "Location is too long"], default: "" },
        // friends
        friends: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
        friendRequests: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }]
        // requests other people sent to me
      },
      { timestamps: true }
    );
    userSchema.pre("save", async function hashPassword(next) {
      if (!this.isModified("password")) return next();
      this.password = await bcrypt.hash(this.password, 10);
      next();
    });
    userSchema.methods.comparePassword = function comparePassword(candidate) {
      return bcrypt.compare(candidate, this.password);
    };
    module2.exports = mongoose2.model("User", userSchema);
  }
});

// src/models/Group.jsx
var require_Group = __commonJS({
  "src/models/Group.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var GROUP_CATEGORIES = [
      "Brand",
      "Off-road",
      "Classic",
      "EV",
      "Racing",
      "Tuning",
      "JDM",
      "General"
    ];
    var groupSchema = new mongoose2.Schema(
      {
        name: {
          type: String,
          required: [true, "Group name is required"],
          unique: true,
          trim: true,
          minlength: [2, "Group name is too short"],
          maxlength: [50, "Group name is too long"]
        },
        description: { type: String, maxlength: [500, "Description is too long"], default: "" },
        category: {
          type: String,
          enum: { values: GROUP_CATEGORIES, message: "{VALUE} is not a valid category" },
          default: "General"
        },
        brand: { type: String, trim: true, maxlength: [40, "Brand is too long"], default: "" },
        coverImage: { type: String, default: "/img/default-cover.svg" },
        admin: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        members: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
        pendingRequests: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
        // people waiting for the admin to let them in
        isPrivate: { type: Boolean, default: false }
      },
      { timestamps: true }
    );
    module2.exports = mongoose2.model("Group", groupSchema);
    module2.exports.CATEGORIES = GROUP_CATEGORIES;
  }
});

// src/models/commentSchema.jsx
var require_commentSchema = __commonJS({
  "src/models/commentSchema.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var commentSchema = new mongoose2.Schema(
      {
        author: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        text: {
          type: String,
          required: [true, "Comment text is required"],
          trim: true,
          maxlength: [500, "Comment is too long"]
        }
      },
      { timestamps: true }
    );
    module2.exports = commentSchema;
  }
});

// src/data/cities.jsx
var require_cities = __commonJS({
  "src/data/cities.jsx"(exports2, module2) {
    var CITIES = [
      { name: "Tel Aviv", major: true, coordinates: [34.7818, 32.0853] },
      { name: "Jerusalem", major: true, coordinates: [35.2137, 31.7683] },
      { name: "Haifa", major: true, coordinates: [34.9896, 32.794] },
      { name: "Rishon LeZion", coordinates: [34.8066, 31.973] },
      { name: "Petah Tikva", coordinates: [34.8878, 32.084] },
      { name: "Ashdod", major: true, coordinates: [34.6553, 31.8044] },
      { name: "Netanya", major: true, coordinates: [34.8532, 32.3215] },
      { name: "Beer Sheva", major: true, coordinates: [34.7915, 31.253] },
      { name: "Holon", coordinates: [34.7725, 32.0117] },
      { name: "Ramat Gan", coordinates: [34.8248, 32.0684] },
      { name: "Herzliya", coordinates: [34.8447, 32.1624] },
      { name: "Kfar Saba", coordinates: [34.907, 32.175] },
      { name: "Raanana", coordinates: [34.8713, 32.1848] },
      { name: "Modiin", major: true, coordinates: [35.0104, 31.8928] },
      { name: "Ashkelon", major: true, coordinates: [34.5742, 31.6688] },
      { name: "Bat Yam", coordinates: [34.75, 32.0171] },
      { name: "Rehovot", coordinates: [34.8113, 31.8928] },
      { name: "Hadera", major: true, coordinates: [34.9196, 32.434] },
      { name: "Nazareth", major: true, coordinates: [35.2978, 32.7021] },
      { name: "Tiberias", major: true, coordinates: [35.5308, 32.7959] },
      { name: "Acre", coordinates: [35.0818, 32.9281] },
      { name: "Safed", major: true, coordinates: [35.496, 32.965] },
      { name: "Kiryat Gat", coordinates: [34.7642, 31.61] },
      { name: "Dimona", major: true, coordinates: [35.0333, 31.0686] },
      { name: "Eilat", major: true, coordinates: [34.9519, 29.5577] },
      { name: "Nahariya", major: true, coordinates: [35.0947, 33.0069] },
      { name: "Kiryat Shmona", major: true, coordinates: [35.5697, 33.2075] },
      { name: "Karmiel", coordinates: [35.3047, 32.9153] },
      { name: "Afula", major: true, coordinates: [35.2902, 32.6078] },
      { name: "Zichron Yaakov", coordinates: [34.9522, 32.5722] },
      { name: "Beit Shemesh", coordinates: [34.9886, 31.7314] },
      { name: "Lod", coordinates: [34.8903, 31.9467] },
      { name: "Yavne", coordinates: [34.7397, 31.8781] },
      { name: "Sderot", coordinates: [34.5964, 31.525] },
      { name: "Ofakim", coordinates: [34.6203, 31.3142] },
      { name: "Arad", coordinates: [35.2125, 31.2589] },
      { name: "Mitzpe Ramon", major: true, coordinates: [34.8014, 30.6103] }
    ];
    var CITY_NAMES = CITIES.map((c) => c.name);
    function coordinatesOf2(cityName) {
      const city = CITIES.find((c) => c.name === cityName);
      return city ? city.coordinates : null;
    }
    module2.exports = { CITIES, CITY_NAMES, coordinatesOf: coordinatesOf2 };
  }
});

// src/data/circuits.jsx
var require_circuits = __commonJS({
  "src/data/circuits.jsx"(exports2, module2) {
    var CIRCUITS = [
      {
        id: "drag-strip",
        name: "Quarter mile drag strip",
        raceTypes: ["Drag"],
        lengthKm: 0.402,
        closed: false,
        unit: "runs",
        description: "Straight line, standing start, two lanes. Timing lights at both ends.",
        layout: [[0.06, 0.55], [0.94, 0.55]]
      },
      {
        id: "port-street",
        name: "Port street circuit",
        raceTypes: ["Track", "Time attack", "Drift"],
        lengthKm: 2.8,
        closed: true,
        unit: "laps",
        description: "Temporary circuit through the port roads. Two long straights and a tight chicane.",
        layout: [
          [0.1, 0.3],
          [0.55, 0.22],
          [0.8, 0.3],
          [0.9, 0.48],
          [0.82, 0.62],
          [0.68, 0.6],
          [0.6, 0.72],
          [0.4, 0.78],
          [0.22, 0.7],
          [0.12, 0.52]
        ]
      },
      {
        id: "desert-oval",
        name: "Desert oval",
        raceTypes: ["Track"],
        lengthKm: 1.6,
        closed: true,
        unit: "laps",
        description: "Simple banked oval on packed sand. Fast and easy to follow from the stands.",
        layout: [
          [0.2, 0.3],
          [0.5, 0.22],
          [0.8, 0.3],
          [0.9, 0.5],
          [0.8, 0.7],
          [0.5, 0.78],
          [0.2, 0.7],
          [0.1, 0.5]
        ]
      },
      {
        id: "kart-track",
        name: "Kart track",
        raceTypes: ["Track", "Time attack"],
        lengthKm: 1.1,
        closed: true,
        unit: "laps",
        description: "Tight and technical, a lot of second gear. Good for time attack in small cars.",
        layout: [
          [0.1, 0.6],
          [0.18, 0.3],
          [0.35, 0.25],
          [0.42, 0.42],
          [0.55, 0.35],
          [0.7, 0.22],
          [0.88, 0.32],
          [0.84, 0.52],
          [0.68, 0.55],
          [0.72, 0.72],
          [0.52, 0.8],
          [0.35, 0.7],
          [0.25, 0.78]
        ]
      },
      {
        id: "mountain-hillclimb",
        name: "Mountain hill climb",
        raceTypes: ["Hillclimb"],
        lengthKm: 4.5,
        closed: false,
        unit: "runs",
        description: "Closed mountain road, bottom to top. One car at a time against the clock.",
        layout: [
          [0.08, 0.85],
          [0.22, 0.8],
          [0.18, 0.66],
          [0.36, 0.6],
          [0.3, 0.46],
          [0.5, 0.42],
          [0.46, 0.3],
          [0.66, 0.28],
          [0.72, 0.16],
          [0.9, 0.12]
        ]
      },
      {
        id: "forest-stage",
        name: "Forest rally stage",
        raceTypes: ["Rally"],
        lengthKm: 12,
        closed: false,
        unit: "passes",
        description: "Gravel forest road, co driver reading notes. Fast crests and blind corners.",
        layout: [
          [0.05, 0.2],
          [0.2, 0.28],
          [0.3, 0.18],
          [0.42, 0.34],
          [0.38, 0.5],
          [0.55, 0.56],
          [0.62, 0.42],
          [0.76, 0.48],
          [0.8, 0.64],
          [0.95, 0.8]
        ]
      },
      {
        id: "skid-pad",
        name: "Drift skid pad",
        raceTypes: ["Drift"],
        lengthKm: 0.8,
        closed: true,
        unit: "laps",
        description: "Wide open tarmac with a figure of eight marked out. Bring spare rear tyres.",
        layout: [
          [0.3, 0.5],
          [0.2, 0.32],
          [0.35, 0.22],
          [0.5, 0.4],
          [0.65, 0.22],
          [0.8, 0.32],
          [0.7, 0.5],
          [0.8, 0.68],
          [0.65, 0.78],
          [0.5, 0.6],
          [0.35, 0.78],
          [0.2, 0.68]
        ]
      },
      {
        id: "industrial-loop",
        name: "Industrial zone loop",
        raceTypes: ["Track", "Time attack", "Drift"],
        lengthKm: 2.2,
        closed: true,
        unit: "laps",
        description: "Wide roads between the warehouses, closed off for the evening. Square corners.",
        layout: [
          [0.12, 0.25],
          [0.6, 0.25],
          [0.6, 0.45],
          [0.88, 0.45],
          [0.88, 0.75],
          [0.35, 0.75],
          [0.35, 0.55],
          [0.12, 0.55]
        ]
      }
    ];
    var CIRCUIT_IDS = CIRCUITS.map((c) => c.id);
    function circuitById(id) {
      return CIRCUITS.find((c) => c.id === id) || null;
    }
    module2.exports = { CIRCUITS, CIRCUIT_IDS, circuitById };
  }
});

// src/models/Event.jsx
var require_Event = __commonJS({
  "src/models/Event.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var commentSchema = require_commentSchema();
    var { CITY_NAMES } = require_cities();
    var { CIRCUIT_IDS } = require_circuits();
    var EVENT_TYPES = ["meet", "race"];
    var RACE_TYPES = ["Drag", "Track", "Rally", "Hillclimb", "Drift", "Time attack"];
    var eventSchema = new mongoose2.Schema(
      {
        title: {
          type: String,
          required: [true, "Title is required"],
          trim: true,
          minlength: [3, "Title is too short"],
          maxlength: [80, "Title is too long"]
        },
        description: { type: String, maxlength: [1e3, "Description is too long"], default: "" },
        type: {
          type: String,
          enum: { values: EVENT_TYPES, message: "{VALUE} is not a valid event type" },
          required: [true, "Event type is required"]
        },
        // these three only matter when the type is 'race'
        raceType: {
          type: String,
          enum: { values: RACE_TYPES.concat([""]), message: "{VALUE} is not a valid race type" },
          default: ""
        },
        // which track from src/data/circuits.js the race is on
        circuit: {
          type: String,
          enum: { values: CIRCUIT_IDS.concat([""]), message: "{VALUE} is not a circuit I know" },
          default: ""
        },
        // how many laps, or runs for a drag strip or hill climb
        laps: { type: Number, min: [1, "At least one lap"], max: [500, "That is a lot of laps"], default: 1 },
        host: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        group: { type: mongoose2.Schema.Types.ObjectId, ref: "Group", default: null },
        startsAt: { type: Date, required: [true, "Start date and time are required"] },
        city: {
          type: String,
          required: [true, "City is required"],
          enum: { values: CITY_NAMES, message: "{VALUE} is not a city we know" }
        },
        address: { type: String, maxlength: [120, "Address is too long"], default: "" },
        // GeoJSON point. the order is [longitude, latitude], not the other way round
        location: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: {
            type: [Number],
            required: true,
            validate: {
              validator: (v) => Array.isArray(v) && v.length === 2,
              message: "Location must be a [longitude, latitude] pair"
            }
          }
        },
        coverImage: { type: String, default: "/img/default-event.svg" },
        maxAttendees: { type: Number, min: [0, "Cannot be negative"], default: 0 },
        // 0 means no limit
        attendees: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
        likes: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema]
      },
      { timestamps: true }
    );
    eventSchema.index({ location: "2dsphere" });
    eventSchema.index({ startsAt: 1 });
    module2.exports = mongoose2.model("Event", eventSchema);
    module2.exports.EVENT_TYPES = EVENT_TYPES;
    module2.exports.RACE_TYPES = RACE_TYPES;
  }
});

// src/models/Listing.jsx
var require_Listing = __commonJS({
  "src/models/Listing.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var commentSchema = require_commentSchema();
    var { CITY_NAMES } = require_cities();
    var LISTING_CATEGORIES = [
      "Whole car",
      "Engine & drivetrain",
      "Wheels & tires",
      "Body & exterior",
      "Interior",
      "Audio & electronics",
      "Tools",
      "Other parts"
    ];
    var CONDITIONS = ["New", "Like new", "Used", "For parts"];
    var listingSchema = new mongoose2.Schema(
      {
        seller: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        title: {
          type: String,
          required: [true, "Title is required"],
          trim: true,
          minlength: [3, "Title is too short"],
          maxlength: [80, "Title is too long"]
        },
        description: { type: String, maxlength: [1e3, "Description is too long"], default: "" },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
          max: [1e7, "Price is unrealistically high"]
        },
        category: {
          type: String,
          enum: { values: LISTING_CATEGORIES, message: "{VALUE} is not a valid category" },
          required: [true, "Category is required"]
        },
        condition: {
          type: String,
          enum: { values: CONDITIONS, message: "{VALUE} is not a valid condition" },
          default: "Used"
        },
        // these three are only used when the thing being sold is a whole car
        make: { type: String, trim: true, maxlength: [40, "Make is too long"], default: "" },
        model: { type: String, trim: true, maxlength: [40, "Model is too long"], default: "" },
        year: {
          type: Number,
          min: [1900, "Year seems too old"],
          max: [(/* @__PURE__ */ new Date()).getFullYear() + 1, "Year is in the future"],
          default: null
        },
        city: {
          type: String,
          required: [true, "City is required"],
          enum: { values: CITY_NAMES, message: "{VALUE} is not a city we know" }
        },
        location: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: {
            type: [Number],
            required: true,
            validate: {
              validator: (v) => Array.isArray(v) && v.length === 2,
              message: "Location must be a [longitude, latitude] pair"
            }
          }
        },
        photos: [{ type: String }],
        status: {
          type: String,
          enum: { values: ["available", "sold"], message: "{VALUE} is not a valid status" },
          default: "available"
        },
        likes: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema]
      },
      { timestamps: true }
    );
    listingSchema.index({ location: "2dsphere" });
    listingSchema.index({ price: 1 });
    module2.exports = mongoose2.model("Listing", listingSchema);
    module2.exports.CATEGORIES = LISTING_CATEGORIES;
    module2.exports.CONDITIONS = CONDITIONS;
  }
});

// src/models/Car.jsx
var require_Car = __commonJS({
  "src/models/Car.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var CAR_CATEGORIES = ["Sedan", "Hatchback", "SUV", "Coupe", "Convertible", "Pickup", "Van", "Other"];
    var carSchema = new mongoose2.Schema(
      {
        owner: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        make: {
          type: String,
          required: [true, "Make is required"],
          trim: true,
          maxlength: [40, "Make is too long"]
        },
        model: {
          type: String,
          required: [true, "Model is required"],
          trim: true,
          maxlength: [40, "Model is too long"]
        },
        year: {
          type: Number,
          required: [true, "Year is required"],
          min: [1900, "Year seems too old"],
          max: [(/* @__PURE__ */ new Date()).getFullYear() + 1, "Year is in the future"]
        },
        category: {
          type: String,
          enum: { values: CAR_CATEGORIES, message: "{VALUE} is not a valid body type" },
          default: "Other"
        },
        engine: { type: String, trim: true, maxlength: [40, "Engine text is too long"], default: "" },
        horsepower: {
          type: Number,
          min: [0, "Horsepower cannot be negative"],
          max: [2e3, "Horsepower seems too high"],
          default: 0
        },
        color: { type: String, trim: true, maxlength: [30, "Color is too long"], default: "" },
        photo: { type: String, default: "/img/default-car.svg" },
        description: { type: String, maxlength: [500, "Description is too long"], default: "" }
      },
      { timestamps: true }
    );
    module2.exports = mongoose2.model("Car", carSchema);
    module2.exports.CATEGORIES = CAR_CATEGORIES;
  }
});

// src/models/Message.jsx
var require_Message = __commonJS({
  "src/models/Message.jsx"(exports2, module2) {
    var mongoose2 = require("mongoose");
    var messageSchema = new mongoose2.Schema(
      {
        from: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        to: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
        text: {
          type: String,
          required: [true, "Message text is required"],
          trim: true,
          maxlength: [1e3, "Message is too long"]
        },
        read: { type: Boolean, default: false }
      },
      { timestamps: true }
    );
    messageSchema.index({ from: 1, to: 1, createdAt: 1 });
    module2.exports = mongoose2.model("Message", messageSchema);
  }
});

// seed/seed.jsx
require("dotenv").config();
if (process.argv.includes("live")) {
  if (!process.env.ATLAS_URI) {
    console.error("[seed] Add ATLAS_URI=<your Atlas connection string> to .env first.");
    process.exit(1);
  }
  process.env.MONGO_URI = process.env.ATLAS_URI;
  console.log("[seed] seeding the LIVE database");
}
var mongoose = require("mongoose");
var connectDB = require_db();
var User = require_User();
var Group = require_Group();
var Event = require_Event();
var Listing = require_Listing();
var Car = require_Car();
var Message = require_Message();
var { coordinatesOf } = require_cities();
var pick = (list) => list[Math.floor(Math.random() * list.length)];
var pickSome = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);
var between = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
function daysFromNow(n, hour = 19) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, [0, 30][between(0, 1)], 0, 0);
  return d;
}
function point(city) {
  return { type: "Point", coordinates: coordinatesOf(city) };
}
var MEMBERS = [
  {
    username: "alon",
    displayName: "Alon Katz",
    location: "Tel Aviv",
    role: "admin",
    bio: "Runs Maslul. Weekends belong to the E30."
  },
  {
    username: "noa",
    displayName: "Noa Bar",
    location: "Haifa",
    bio: "Track days and cold brews. Time attack regular."
  },
  {
    username: "yossi",
    displayName: "Yossi Mizrahi",
    location: "Beer Sheva",
    bio: "Desert runs, lockers and recovery gear."
  },
  {
    username: "dana",
    displayName: "Dana Levi",
    location: "Ramat Gan",
    bio: "EV convert. Still misses the noise."
  },
  {
    username: "itai",
    displayName: "Itai Cohen",
    location: "Netanya",
    bio: "JDM only. 2JZ or nothing."
  },
  {
    username: "maya",
    displayName: "Maya Shalev",
    location: "Jerusalem",
    bio: "Classic Alfas and stubborn carburettors."
  },
  {
    username: "omer",
    displayName: "Omer Peretz",
    location: "Ashdod",
    bio: "Drift practice most Fridays. Bring tyres."
  },
  {
    username: "tamar",
    displayName: "Tamar Golan",
    location: "Herzliya",
    bio: "Detailer by trade, hoarder of polish."
  },
  {
    username: "eitan",
    displayName: "Eitan Rosen",
    location: "Rishon LeZion",
    bio: "Drag racing. Numbers or it did not happen."
  },
  {
    username: "shira",
    displayName: "Shira Adler",
    location: "Modiin",
    bio: "Sunday morning canyon drives."
  },
  {
    username: "gil",
    displayName: "Gil Avraham",
    location: "Eilat",
    bio: "Southern routes and long convoys."
  },
  {
    username: "roni",
    displayName: "Roni Katz",
    location: "Kfar Saba",
    bio: "Wrenching on a budget. Parts always wanted."
  },
  {
    username: "avi",
    displayName: "Avi Ben David",
    location: "Petah Tikva",
    bio: "M3 E46 owner, two track days a year and a lot of polishing in between."
  },
  {
    username: "lior",
    displayName: "Lior Friedman",
    location: "Haifa",
    bio: "Carmel roads every Saturday morning. MX-5 forever."
  },
  {
    username: "yael",
    displayName: "Yael Biton",
    location: "Tel Aviv",
    bio: "Photographer. I shoot the meets, you buy me coffee."
  },
  {
    username: "ido",
    displayName: "Ido Ashkenazi",
    location: "Rehovot",
    bio: "Mechanical engineering student, building an AE86 one bolt at a time."
  },
  {
    username: "michal",
    displayName: "Michal Dahan",
    location: "Ashkelon",
    bio: "Rally fan. Gravel, mud, anything but asphalt."
  },
  {
    username: "nadav",
    displayName: "Nadav Segal",
    location: "Hod Hasharon",
    bio: "Porsche air cooled and water cooled, no arguments please."
  },
  {
    username: "hila",
    displayName: "Hila Ohana",
    location: "Beer Sheva",
    bio: "Land Cruiser 78, roof tent, Negev every second weekend."
  },
  {
    username: "daniel",
    displayName: "Daniel Kaplan",
    location: "Raanana",
    bio: "Tesla Model 3 Performance. Yes it is fast, no I will not race you."
  },
  {
    username: "noam",
    displayName: "Noam Elbaz",
    location: "Holon",
    bio: "Drag strip regular. Quarter mile is life."
  },
  {
    username: "tal",
    displayName: "Tal Weiss",
    location: "Zichron Yaakov",
    bio: "Classic Beetles and a garage that smells like oil."
  },
  {
    username: "ron",
    displayName: "Ron Malka",
    location: "Kiryat Gat",
    bio: "Evo IX owner. The 4G63 is the best engine ever made, fight me."
  },
  {
    username: "sapir",
    displayName: "Sapir Levy",
    location: "Netanya",
    bio: "GTI Mk7 daily, stage one and a lot of brake dust."
  },
  {
    username: "amit",
    displayName: "Amit Hadad",
    location: "Afula",
    bio: "Off-road in the Galilee. Defender 90, lift kit, no regrets."
  },
  {
    username: "gal",
    displayName: "Gal Mor",
    location: "Ramat Hasharon",
    bio: "Hill climbs and canyon roads. Smooth is fast."
  },
  {
    username: "shani",
    displayName: "Shani Azulay",
    location: "Bat Yam",
    bio: "Detailing and ceramic coating. Ask me about swirl marks."
  },
  {
    username: "erez",
    displayName: "Erez Gabay",
    location: "Tiberias",
    bio: "EV road trips around the Kinneret. Charging map nerd."
  },
  {
    username: "adi",
    displayName: "Adi Yosef",
    location: "Rosh HaAyin",
    bio: "Civic Type R and every Honda before it."
  },
  {
    username: "yoav",
    displayName: "Yoav Sharabi",
    location: "Kfar Saba",
    bio: "Muscle cars. Mustang now, Challenger next."
  },
  {
    username: "keren",
    displayName: "Keren Nachum",
    location: "Givatayim",
    bio: "Supercar spotter, Ferrari 296 dreamer."
  },
  {
    username: "barak",
    displayName: "Barak Zur",
    location: "Eilat",
    bio: "Drift practice in the south. Two sets of tyres minimum."
  },
  // the account behind the 'Demo User' button on the login page
  {
    username: "demo",
    displayName: "Demo Driver",
    location: "Tel Aviv",
    bio: "The demo account. Look around, everything here is test data."
  }
];
var GROUPS = [
  {
    name: "BMW Israel",
    category: "Brand",
    brand: "BMW",
    description: "Everything from the E30 and E46 M3 to the new M2, M3 CS and M4. Meets, technical help and parts.",
    coverImage: "/img/cars/bmw-m3-cs-2023.jpg"
  },
  {
    name: "JDM Israel",
    category: "JDM",
    brand: "Toyota",
    description: "Japanese cars of every era. Supras, Skylines, AE86s, Silvias and the daily Civics too.",
    coverImage: "/img/cars/nissan-r34.jpg"
  },
  {
    name: "Negev Off-road",
    category: "Off-road",
    brand: "Land Rover",
    description: "Desert routes, recovery practice and convoys every month. Land Cruisers, Defenders, Patrols and Wranglers welcome.",
    coverImage: "/img/cars/defender-90.jpg"
  },
  {
    name: "Classic Cars IL",
    category: "Classic",
    brand: "",
    description: "Anything over thirty years old and still moving under its own power. Beetles, Giulias, F40s and everything between.",
    coverImage: "/img/cars/vw-beetle.jpg"
  },
  {
    name: "EV Drivers IL",
    category: "EV",
    brand: "Tesla",
    description: "Charging maps, road trips and range arguments. Model 3, Model Y and the rest.",
    coverImage: "/img/cars/tesla-model-3.jpg"
  },
  {
    name: "Drift Collective",
    category: "Racing",
    brand: "Nissan",
    description: "Tandem practice days, tyre orders and seat time. Private group, we approve members.",
    coverImage: "/img/events/drift-race.jpg",
    isPrivate: true
  },
  {
    name: "Tuning Garage",
    category: "Tuning",
    brand: "",
    description: "Maps, dynos and honest dyno graphs. Focus RS, Evo, STI and everything that makes more than it should.",
    coverImage: "/img/cars/ford-focus-rs.jpg"
  }
];
var CARS = [
  { make: "BMW", model: "M3 E30", photo: "/img/cars/bmw-m3-e30.jpg", year: 1989, category: "Coupe", engine: "S14 2.3", horsepower: 195, color: "Alpine White" },
  { make: "BMW", model: "M340i", photo: "/img/cars/bmw-m340i.jpg", year: 2021, category: "Sedan", engine: "B58 3.0T", horsepower: 374, color: "Portimao Blue" },
  { make: "BMW", model: "325i E36", photo: "/img/cars/bmw-e36.jpg", year: 1995, category: "Coupe", engine: "M50B25", horsepower: 189, color: "Boston Green" },
  { make: "Toyota", model: "Supra MK4", photo: "/img/cars/toyota-supra-mk4.jpg", year: 1997, category: "Coupe", engine: "2JZ-GTE", horsepower: 320, color: "Renaissance Red" },
  { make: "Toyota", model: "GR86", photo: "/img/cars/toyota-gr86.jpg", year: 2023, category: "Coupe", engine: "FA24", horsepower: 234, color: "Track Red" },
  { make: "Toyota", model: "Land Cruiser 78", photo: "/img/cars/land-cruiser-78.jpg", year: 2004, category: "SUV", engine: "1HZ 4.2 diesel", horsepower: 129, color: "Sand" },
  { make: "Nissan", model: "Skyline R34 GT-T", photo: "/img/cars/nissan-r34.jpg", year: 1999, category: "Coupe", engine: "RB25DET", horsepower: 280, color: "Bayside Blue" },
  { make: "Nissan", model: "Silvia S15", photo: "/img/cars/nissan-s15.jpg", year: 2e3, category: "Coupe", engine: "SR20DET", horsepower: 250, color: "Pearl White" },
  { make: "Nissan", model: "Patrol Y61", photo: "/img/cars/nissan-patrol.jpg", year: 2006, category: "SUV", engine: "ZD30", horsepower: 158, color: "Silver" },
  { make: "Mazda", model: "MX-5 NA", photo: "/img/cars/mazda-mx5-na.jpg", year: 1994, category: "Convertible", engine: "B6ZE 1.6", horsepower: 115, color: "Classic Red" },
  { make: "Mazda", model: "RX-7 FD", photo: "/img/cars/mazda-rx7-fd.jpg", year: 1993, category: "Coupe", engine: "13B-REW", horsepower: 276, color: "Montego Blue" },
  { make: "Honda", model: "Civic Type R FK8", photo: "/img/cars/honda-civic-fk8.jpg", year: 2019, category: "Hatchback", engine: "K20C1", horsepower: 320, color: "Championship White" },
  { make: "Honda", model: "S2000", photo: "/img/cars/honda-s2000.jpg", year: 2004, category: "Convertible", engine: "F20C", horsepower: 240, color: "Berlina Black" },
  { make: "Subaru", model: "Impreza WRX STI", photo: "/img/cars/subaru-sti.jpg", year: 2006, category: "Sedan", engine: "EJ257", horsepower: 280, color: "World Rally Blue" },
  { make: "Volkswagen", model: "Golf GTI Mk7", photo: "/img/cars/vw-golf-gti-mk7.jpg", year: 2017, category: "Hatchback", engine: "EA888 2.0T", horsepower: 227, color: "Tornado Red" },
  { make: "Volkswagen", model: "Beetle", photo: "/img/cars/vw-beetle.jpg", year: 1971, category: "Coupe", engine: "1.6 flat four", horsepower: 60, color: "Marina Blue" },
  { make: "Tesla", model: "Model 3 Performance", photo: "/img/cars/tesla-model-3.jpg", year: 2022, category: "Sedan", engine: "Dual motor", horsepower: 510, color: "Deep Blue" },
  { make: "Tesla", model: "Model Y", photo: "/img/cars/tesla-model-y.jpg", year: 2023, category: "SUV", engine: "Long range", horsepower: 384, color: "Pearl White" },
  { make: "Alfa Romeo", model: "Giulia Super", photo: "/img/cars/alfa-giulia-1972.jpg", year: 1972, category: "Sedan", engine: "1.6 twin cam", horsepower: 102, color: "Rosso" },
  { make: "Porsche", model: "944", photo: "/img/cars/porsche-944.jpg", year: 1986, category: "Coupe", engine: "2.5 inline four", horsepower: 160, color: "Guards Red" },
  { make: "Ford", model: "Mustang GT", photo: "/img/cars/ford-mustang-gt.jpg", year: 2018, category: "Coupe", engine: "Coyote 5.0", horsepower: 450, color: "Race Red" },
  { make: "Land Rover", model: "Defender 90", photo: "/img/cars/defender-90.jpg", year: 1998, category: "SUV", engine: "300Tdi", horsepower: 111, color: "Coniston Green" },
  { make: "Jeep", model: "Wrangler JK", photo: "/img/cars/jeep-wrangler-jk.jpg", year: 2012, category: "SUV", engine: "3.6 Pentastar", horsepower: 285, color: "Black" },
  { make: "Mitsubishi", model: "Lancer Evo IX", photo: "/img/cars/mitsubishi-evo9.jpg", year: 2006, category: "Sedan", engine: "4G63T", horsepower: 286, color: "Rally Red" },
  { make: "BMW", model: "M3 E46", photo: "/img/cars/bmw-m3-e46-2003.jpg", year: 2003, category: "Coupe", engine: "S54 3.2", horsepower: 338, color: "Laguna Seca Blue" },
  { make: "BMW", model: "M2", photo: "/img/cars/bmw-m2-2025.jpg", year: 2025, category: "Coupe", engine: "S58 3.0T", horsepower: 473, color: "Zandvoort Blue" },
  { make: "BMW", model: "M3 CS", photo: "/img/cars/bmw-m3-cs-2023.jpg", year: 2023, category: "Sedan", engine: "S58 3.0T", horsepower: 543, color: "Brands Hatch Grey" },
  { make: "BMW", model: "M4 Competition", photo: "/img/cars/bmw-m4-competition-2024.jpg", year: 2024, category: "Coupe", engine: "S58 3.0T", horsepower: 503, color: "Isle of Man Green" },
  { make: "Ferrari", model: "296 GTB", photo: "/img/cars/ferrari-296-gtb-2023.jpg", year: 2023, category: "Coupe", engine: "3.0 V6 hybrid", horsepower: 819, color: "Rosso Corsa" },
  { make: "Ferrari", model: "F40", photo: "/img/cars/ferrari-f40.jpg", year: 1990, category: "Coupe", engine: "2.9 twin turbo V8", horsepower: 471, color: "Rosso Corsa" },
  { make: "Lamborghini", model: "Huracan", photo: "/img/cars/lamborghini-huracan.jpg", year: 2019, category: "Coupe", engine: "5.2 V10", horsepower: 631, color: "Arancio Borealis" },
  { make: "McLaren", model: "720S", photo: "/img/cars/mclaren-720s.jpg", year: 2018, category: "Coupe", engine: "M840T 4.0 V8", horsepower: 710, color: "Volcano Orange" },
  { make: "Audi", model: "R8 V10", photo: "/img/cars/audi-r8-v10.jpg", year: 2021, category: "Coupe", engine: "5.2 V10", horsepower: 562, color: "Daytona Grey" },
  { make: "Porsche", model: "911 GT3 RS (997)", photo: "/img/cars/porsche-997-gt3-rs.jpg", year: 2007, category: "Coupe", engine: "3.6 flat six", horsepower: 415, color: "Arctic Silver" },
  { make: "Dodge", model: "Challenger Hellcat", photo: "/img/cars/dodge-challenger-hellcat.jpg", year: 2018, category: "Coupe", engine: "6.2 supercharged V8", horsepower: 707, color: "B5 Blue" },
  { make: "Mercedes-Benz", model: "C63 AMG (W204)", photo: "/img/cars/mercedes-amg-c63.jpg", year: 2013, category: "Sedan", engine: "M156 6.2 V8", horsepower: 457, color: "Designo Mocha" },
  { make: "Ford", model: "Focus RS Mk3", photo: "/img/cars/ford-focus-rs.jpg", year: 2017, category: "Hatchback", engine: "2.3 EcoBoost", horsepower: 350, color: "Stealth Grey" },
  { make: "Toyota", model: "AE86 Sprinter Trueno", photo: "/img/cars/toyota-ae86.jpg", year: 1985, category: "Coupe", engine: "4A-GE", horsepower: 128, color: "Panda White" },
  { make: "Mini", model: "Cooper", photo: "/img/cars/mini-cooper.jpg", year: 2018, category: "Hatchback", engine: "1.5 turbo three", horsepower: 136, color: "Lime Green" }
];
var EVENT_TEMPLATES = [
  {
    title: "Friday night cruise",
    coverImage: "/img/events/friday-night-cruise.jpg",
    type: "meet",
    city: "Tel Aviv",
    address: "Ha-Miflasim parking",
    description: "Meet at nine, roll out at ten for a night run through the city and the tunnels. Lights on, speed sensible, all cars welcome."
  },
  {
    title: "Haifa port meet",
    coverImage: "/img/events/car-meet.jpg",
    type: "meet",
    city: "Haifa",
    address: "Port lot, gate 3",
    description: "Monthly gathering by the water. Exotics, tuners and daily drivers share the lot, coffee from the truck at the corner."
  },
  {
    title: "Negev desert run",
    coverImage: "/img/events/negev-desert.jpg",
    type: "meet",
    city: "Beer Sheva",
    address: "Route 40 junction",
    description: "Full day convoy on the desert tracks south of Beer Sheva. Bring recovery gear, a spare and more water than you think. Camels have right of way."
  },
  {
    title: "Sunday canyon drive",
    coverImage: "/img/events/sunday-drive.jpg",
    type: "meet",
    city: "Jerusalem",
    address: "Ein Kerem car park",
    description: "Early start, twisty mountain roads, a line of cars through every bend, breakfast at the end."
  },
  {
    title: "Cars and coffee",
    coverImage: "/img/events/car-meet.jpg",
    type: "meet",
    city: "Herzliya",
    address: "Marina lot",
    description: "Relaxed morning meet. Supercars next to hot hatches, park up, talk rubbish, go home by noon."
  },
  {
    title: "Classic breakfast run",
    coverImage: "/img/events/classic-meet.jpg",
    type: "meet",
    city: "Netanya",
    address: "Seafront promenade",
    description: "Chrome, wood rims and carburettors. Pre-1995 cars preferred but nobody is turned away, breakfast on the promenade."
  },
  {
    title: "EV road trip north",
    coverImage: "/img/events/ev-charging.jpg",
    type: "meet",
    city: "Tiberias",
    address: "Lakeside charger",
    description: "Charging stops planned at the superchargers along the way, route shared the day before."
  },
  {
    title: "Drag night",
    coverImage: "/img/events/drag-race.jpg",
    type: "race",
    raceType: "Drag",
    circuit: "drag-strip",
    laps: 8,
    city: "Rishon LeZion",
    address: "Industrial zone strip",
    description: "Burnout box, then timed runs two cars at a time. Helmets required, tech check at the gate."
  },
  {
    title: "Time attack round",
    coverImage: "/img/events/time-attack.jpg",
    type: "race",
    raceType: "Time attack",
    circuit: "kart-track",
    laps: 12,
    city: "Ashdod",
    address: "Circuit south paddock",
    description: "Three sessions, timing transponders provided. Street cars and touring cars run in separate classes."
  },
  {
    title: "Drift practice",
    coverImage: "/img/events/drift-race.jpg",
    type: "race",
    raceType: "Drift",
    circuit: "skid-pad",
    laps: 15,
    city: "Ashkelon",
    address: "Skid pad",
    description: "Open practice with tandem runs. Expect smoke, bring at least two sets of rear tyres."
  },
  {
    title: "Hill climb",
    coverImage: "/img/events/hill-climb.jpg",
    type: "race",
    raceType: "Hillclimb",
    circuit: "mountain-hillclimb",
    laps: 3,
    city: "Safed",
    address: "Mountain road closure",
    description: "Closed road, single car runs from open-wheel cars to production classes, marshals on every corner."
  },
  {
    title: "Rally sprint",
    coverImage: "/img/events/rally-sprint.jpg",
    type: "race",
    raceType: "Rally",
    circuit: "forest-stage",
    laps: 2,
    city: "Modiin",
    address: "Forest service road",
    description: "Gravel stage for Group A Imprezas, Evos and anything brave enough. Co-driver mandatory."
  },
  {
    title: "Track day",
    coverImage: "/img/events/track-day.jpg",
    type: "race",
    raceType: "Track",
    circuit: "port-street",
    laps: 20,
    city: "Eilat",
    address: "Southern circuit",
    description: "Novice and open groups, GT cars welcome. Instruction available for the first session and the pit lane is family friendly."
  },
  {
    title: "Supercar Sunday",
    coverImage: "/img/events/car-meet.jpg",
    type: "meet",
    city: "Herzliya",
    address: "Arena mall upper lot",
    description: "Exotics up front, everything else around them. Bring the camera, leave the launch control at home."
  },
  {
    title: "Galilee loop",
    coverImage: "/img/events/sunday-drive.jpg",
    type: "meet",
    city: "Karmiel",
    address: "Big Fashion car park",
    description: "Mountain roads around Karmiel and Safed, lunch stop by the Kinneret. Around 180 km."
  },
  {
    title: "Late night tunnel run",
    coverImage: "/img/events/friday-night-cruise.jpg",
    type: "meet",
    city: "Haifa",
    address: "Carmel Tunnels north entrance",
    description: "Short run through the tunnels and up to the Carmel lookout. Quiet exhausts, please."
  },
  {
    title: "Off-road recovery training",
    coverImage: "/img/events/negev-desert.jpg",
    type: "meet",
    city: "Mitzpe Ramon",
    address: "Crater visitor centre",
    description: "Snatch straps, tyre pressures and how not to roll it. Instructor led, bring gloves."
  },
  {
    title: "Classic car show",
    coverImage: "/img/events/classic-meet.jpg",
    type: "meet",
    city: "Zichron Yaakov",
    address: "Founders park",
    description: "Judged show with three classes: pre-1970, 70s and 80s. Entry is free for spectators."
  },
  {
    title: "Tesla owners meetup",
    coverImage: "/img/events/ev-charging.jpg",
    type: "meet",
    city: "Hadera",
    address: "Supercharger station",
    description: "Software updates, range tips and a short convoy to the beach. Any EV is welcome."
  },
  {
    title: "Drag strip test and tune",
    coverImage: "/img/events/drag-race.jpg",
    type: "race",
    raceType: "Drag",
    circuit: "drag-strip",
    laps: 6,
    city: "Beer Sheva",
    address: "Airfield strip",
    description: "Unlimited runs, slip after every pass. Good night to try new launch settings."
  },
  {
    title: "Night drift session",
    coverImage: "/img/events/drift-race.jpg",
    type: "race",
    raceType: "Drift",
    circuit: "industrial-loop",
    laps: 12,
    city: "Haifa",
    address: "Bay industrial loop",
    description: "Under the lights, tandem pairs from nine. Judges on the last hour for a bit of fun."
  },
  {
    title: "Rally school",
    coverImage: "/img/events/rally-sprint.jpg",
    type: "race",
    raceType: "Rally",
    circuit: "forest-stage",
    laps: 3,
    city: "Beit Shemesh",
    address: "Forest service road 2",
    description: "Pace notes, left foot braking and a timed run at the end. Co-drivers welcome."
  },
  {
    title: "Touring car sprint",
    coverImage: "/img/events/time-attack.jpg",
    type: "race",
    raceType: "Time attack",
    circuit: "kart-track",
    laps: 15,
    city: "Ashdod",
    address: "Circuit south paddock",
    description: "Short sprint sessions for hatchbacks and saloons. Tyre limit of one set."
  },
  {
    title: "Mountain hill climb",
    coverImage: "/img/events/hill-climb.jpg",
    type: "race",
    raceType: "Hillclimb",
    circuit: "mountain-hillclimb",
    laps: 4,
    city: "Kiryat Shmona",
    address: "Hermon road closure",
    description: "The northern round. Four runs each, best time counts."
  },
  {
    title: "Desert oval race",
    coverImage: "/img/events/track-day.jpg",
    type: "race",
    raceType: "Track",
    circuit: "desert-oval",
    laps: 30,
    city: "Dimona",
    address: "Desert oval",
    description: "Wheel to wheel on the oval, two heats and a final. Full face helmets required."
  }
];
var LISTINGS = [
  {
    title: 'BBS RS 16" set of four',
    photos: ["/img/cars/wheels-bbs.jpg"],
    price: 4200,
    category: "Wheels & tires",
    condition: "Used",
    description: "Refurbished lips, straight, no cracks. 4x100."
  },
  {
    title: 'Volk TE37 17" gunmetal',
    photos: ["/img/cars/wheels-te37.jpg"],
    price: 8900,
    category: "Wheels & tires",
    condition: "Like new",
    description: "Barely used, 5x114.3. Genuine, with centre caps."
  },
  {
    title: "Set of Michelin PS4S 245/40/18",
    photos: ["/img/parts/tyres-michelin.jpg"],
    price: 2600,
    category: "Wheels & tires",
    condition: "Used",
    description: "About 60% left. Even wear, no repairs."
  },
  {
    title: "S14 SR20DET complete engine",
    photos: ["/img/cars/engine-sr20.jpg"],
    price: 15500,
    category: "Engine & drivetrain",
    condition: "Used",
    description: "Compression tested, comes with loom and ECU."
  },
  {
    title: "Cold air intake with cone filter",
    photos: ["/img/parts/cold-air-intake.jpg"],
    price: 480,
    category: "Engine & drivetrain",
    condition: "Used",
    description: "Polished pipe and a washable filter. Came off a V8 build, fits most cars with a 3.5 inch MAF."
  },
  {
    title: "Coilover set, adjustable",
    photos: ["/img/cars/coilovers.jpg"],
    price: 3400,
    category: "Engine & drivetrain",
    condition: "Like new",
    description: "One season of road use. All keys and tools included."
  },
  {
    title: "Brembo front brake kit, 6 piston",
    photos: ["/img/parts/brembo-caliper.jpg"],
    price: 7200,
    category: "Engine & drivetrain",
    condition: "Used",
    description: "Pulled from an M3 E46 when it went to carbon ceramics. Calipers, discs and lines included."
  },
  {
    title: "E30 front bumper, original",
    photos: ["/img/cars/bmw-m3-e30.jpg"],
    price: 1200,
    category: "Body & exterior",
    condition: "Used",
    description: "Straight, small scuff underneath. No cracks."
  },
  {
    title: "Carbon bonnet with vents",
    photos: ["/img/parts/carbon-bonnet.jpg"],
    price: 2900,
    category: "Body & exterior",
    condition: "New",
    description: "Never fitted, still wrapped. Pins included."
  },
  {
    title: "Bucket seat with rails",
    photos: ["/img/cars/bucket-seat.jpg"],
    price: 1800,
    category: "Interior",
    condition: "Used",
    description: "FIA date expired, fine for road and practice use."
  },
  {
    title: "Momo steering wheel 350mm",
    photos: ["/img/parts/steering-wheel.jpg"],
    price: 650,
    category: "Interior",
    condition: "Used",
    description: "Leather, some shine on the top. Boss kit not included."
  },
  {
    title: "Double din head unit with CarPlay",
    photos: ["/img/cars/head-unit.jpg"],
    price: 950,
    category: "Audio & electronics",
    condition: "Like new",
    description: "Removed when I sold the car. Harness included."
  },
  {
    title: "Dash cam, front and rear",
    photos: ["/img/cars/dash-cam.jpg"],
    price: 420,
    category: "Audio & electronics",
    condition: "New",
    description: "Sealed box, hardwire kit included."
  },
  {
    title: "Trolley jack, 3 ton",
    photos: ["/img/parts/trolley-jack.jpg"],
    price: 780,
    category: "Tools",
    condition: "Used",
    description: "Low profile, holds pressure. Two axle stands included."
  },
  {
    title: "Torque wrench set",
    photos: ["/img/cars/torque-wrench.jpg"],
    price: 540,
    category: "Tools",
    condition: "Like new",
    description: "Calibrated last year, in the case."
  },
  {
    title: "Mazda MX-5 NA, running project",
    photos: ["/img/cars/mazda-mx5-na.jpg"],
    price: 34e3,
    category: "Whole car",
    condition: "Used",
    make: "Mazda",
    model: "MX-5",
    year: 1994,
    description: "Drives well, test passed. Some rust in the usual arches, honest car."
  },
  {
    title: "VW Golf Mk7 GTI",
    photos: ["/img/cars/vw-golf-gti-mk7.jpg"],
    price: 98e3,
    category: "Whole car",
    condition: "Used",
    make: "Volkswagen",
    model: "Golf",
    year: 2017,
    description: "Full service history, second owner, stage one map with the original file saved."
  },
  {
    title: "Honda Civic EK, track prepared",
    photos: ["/img/cars/honda-civic-ek.jpg"],
    price: 42e3,
    category: "Whole car",
    condition: "For parts",
    make: "Honda",
    model: "Civic",
    year: 1998,
    description: "Caged, no interior, sold as a track car only. Trailer collection."
  },
  {
    title: "Focus RS Mk3 stage 2 kit",
    photos: ["/img/cars/ford-focus-rs.jpg"],
    price: 3900,
    category: "Engine & drivetrain",
    condition: "Like new",
    description: "Intake, cat back and the tune file. Fitted for one season, all receipts available."
  },
  {
    title: "AE86 4A-GE engine and gearbox",
    photos: ["/img/parts/engine-4age.jpg"],
    price: 12e3,
    category: "Engine & drivetrain",
    condition: "Used",
    description: "Red top twin cam, runs sweet, comes out with the T50 box. Sold with the loom."
  },
  {
    title: "Assorted E36 spares",
    photos: ["/img/cars/bmw-e36.jpg"],
    price: 300,
    category: "Other parts",
    condition: "For parts",
    description: "Box of trim, brackets and clips. Take the lot."
  },
  {
    title: "Turbo cutaway, workshop display",
    photos: ["/img/parts/turbocharger.jpg"],
    price: 850,
    category: "Engine & drivetrain",
    condition: "Like new",
    description: "Sectioned turbocharger on a wooden stand. Great for the garage wall or teaching how boost works."
  },
  {
    title: "Bucket seat with 6 point harness",
    photos: ["/img/parts/harness-seat.jpg"],
    price: 3600,
    category: "Interior",
    condition: "Used",
    description: "Out of a GT3 RS, harness dated 2024. Side mounts included."
  },
  {
    title: 'AMG 20" wheels with Michelin PS5',
    photos: ["/img/parts/alloy-wheel.jpg"],
    price: 11500,
    category: "Wheels & tires",
    condition: "Like new",
    description: "Forged, matte black, tyres at 80%. Fits most Mercedes with 5x112."
  },
  {
    title: "Car battery 70Ah, AGM",
    photos: ["/img/parts/car-battery.jpg"],
    price: 520,
    category: "Audio & electronics",
    condition: "New",
    description: "Bought for a car I sold before fitting it. Still sealed, two year warranty."
  },
  {
    title: "Short shifter with leather knob",
    photos: ["/img/parts/gear-stick.jpg"],
    price: 690,
    category: "Interior",
    condition: "Used",
    description: "Cuts the throw by about a third. Boot included, fits most front wheel drive hatches."
  },
  {
    title: "Socket set, 94 pieces",
    photos: ["/img/parts/socket-set.jpg"],
    price: 380,
    category: "Tools",
    condition: "Like new",
    description: "Two ratchets, metric and imperial, metal case. Nothing missing."
  },
  {
    title: "LED headlight units, pair",
    photos: ["/img/parts/led-headlights.jpg"],
    price: 2400,
    category: "Body & exterior",
    condition: "Used",
    description: "Original LED units, both working, no condensation. Clips intact."
  },
  {
    title: "Nissan Silvia S15, drift spec",
    photos: ["/img/cars/nissan-s15.jpg", "/img/cars/engine-sr20.jpg"],
    price: 145e3,
    category: "Whole car",
    condition: "Used",
    make: "Nissan",
    model: "Silvia",
    year: 2e3,
    description: "SR20DET, hydro handbrake, coilovers. Two sets of spare wheels go with it."
  },
  {
    title: "Mitsubishi Lancer Evo IX",
    photos: ["/img/cars/mitsubishi-evo9.jpg"],
    price: 168e3,
    category: "Whole car",
    condition: "Used",
    make: "Mitsubishi",
    model: "Lancer Evolution",
    year: 2006,
    description: "Unmodified, full history, timing belt done last year."
  },
  {
    title: "Land Rover Defender 90 300Tdi",
    photos: ["/img/cars/defender-90.jpg"],
    price: 89e3,
    category: "Whole car",
    condition: "Used",
    make: "Land Rover",
    model: "Defender",
    year: 1998,
    description: "Galvanised chassis, winch, snorkel. Ready for the desert."
  },
  {
    title: "Porsche 944, project",
    photos: ["/img/cars/porsche-944.jpg"],
    price: 52e3,
    category: "Whole car",
    condition: "For parts",
    make: "Porsche",
    model: "944",
    year: 1986,
    description: "Runs, needs a clutch and some love. Interior is good."
  },
  {
    title: "Volk TE37 wheels and coilover combo",
    photos: ["/img/cars/wheels-te37.jpg", "/img/cars/coilovers.jpg"],
    price: 11800,
    category: "Wheels & tires",
    condition: "Used",
    description: "Both off my S15, sold together only. 5x114.3."
  }
];
var CONVERSATIONS = [
  [
    "Are you bringing the Supra on Friday?",
    "Planned to, if the weather holds.",
    "Forecast looks fine. We roll out at ten.",
    "See you there."
  ],
  [
    "Is the wheel set still available?",
    "It is. Where are you based?",
    "Haifa, I can collect on the weekend.",
    "That works. I will hold them for you."
  ],
  [
    "Great turnout at the meet last night.",
    "Best one this year I think.",
    "Same spot next month?",
    "Same spot. I will post it this week."
  ],
  [
    "Do you have space in the convoy?",
    "Two spots left, both yours if you want them.",
    "Perfect, count us in."
  ],
  [
    "What pressures do you run on track?",
    "Start at 2.0 cold and let them come up to about 2.4.",
    "That is lower than I expected, thanks."
  ],
  [
    "Saw your car at the marina meet, the colour is unreal.",
    "Thanks! Factory paint, just a lot of polishing.",
    "Which product do you use?",
    "Ceramic spray every two months. I will send you the link."
  ],
  [
    "Anyone you trust for an alignment in the centre?",
    "The shop in Holon, ask for Moshe.",
    "Does he do track setups?",
    "Yes, tell him what tyres you run and he sorts it."
  ],
  [
    "Did you get the times from the drag night?",
    "Twelve point eight on the best run.",
    "Not bad for street tyres.",
    "Next time on slicks, watch this space."
  ],
  [
    "Is the Negev run still on with the heat?",
    "Yes, we leave at five to beat it.",
    "Ok, I will bring the compressor.",
    "Great, we always need one."
  ],
  [
    "Thinking of selling the bucket seats, interested?",
    "Maybe, what rails are they on?",
    "Universal, fits most hatchbacks.",
    "Send me photos and a price."
  ]
];
var DEMO_CONVERSATIONS = [
  [
    "Hey, welcome to Maslul! Saw the Supra in your garage, is it the 2JZ-GTE?",
    "Yes, stock turbos for now.",
    "Keep it that way as long as you can, they are getting rare.",
    "That is the plan. Are you at the Friday cruise?",
    "Wouldn't miss it. See you at nine."
  ],
  [
    "Are you still selling the bucket seat?",
    "Yes, still available.",
    "Would you do 1500 if I pick it up this week?",
    "Make it 1650 and it is yours.",
    "Deal. Thursday evening ok?"
  ],
  [
    "Your E46 is coming to the track day right?",
    "Booked in the open group.",
    "Nice, we can share a pit box.",
    "Perfect, I will bring the tyre warmers."
  ],
  [
    "Can I join the drift group? I have been practising on the skid pad.",
    "Sure, request it and I will approve you.",
    "Done, just sent the request."
  ],
  [
    "Got any spare GR86 parts? Looking for the stock exhaust.",
    "I still have it in the garage actually.",
    "How much?",
    "Free if you collect, it is just taking up space.",
    "Legend, thank you!"
  ],
  [
    "Photos from the cars and coffee are up!",
    "Amazing shots, can I use one as my cover?",
    "Of course, tag me."
  ]
];
var EVENT_COMMENTS = [
  "Count me in.",
  "Is there parking nearby?",
  "Bringing a friend if that is fine.",
  "What time does it finish?",
  "Been waiting for this one.",
  "Is there a fee?",
  "Last one was great, see you there.",
  "Can I bring the kids?",
  "Coming straight from work, might be late.",
  "Any rain plan?",
  "Who is bringing coffee?",
  "First time, any tips?"
];
var LISTING_COMMENTS = [
  "Is this still available?",
  "Would you take less for a quick sale?",
  "Any photos of the back?",
  "Can you post it?",
  "Does it fit an E46?",
  "Sent you a message.",
  "Great price.",
  "Interested if the other buyer falls through."
];
async function seed() {
  const keep = process.argv.includes("keep");
  await connectDB();
  if (!keep) {
    console.log("[seed] clearing existing data\xE2\u20AC\xA6");
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Event.deleteMany({}),
      Listing.deleteMany({}),
      Car.deleteMany({}),
      Message.deleteMany({})
    ]);
  }
  const users = [];
  for (const member of MEMBERS) {
    users.push(await User.create(Object.assign(
      { password: "secret123", avatar: "/img/avatars/" + member.username + ".svg" },
      member
    )));
  }
  console.log(`[seed] ${users.length} members`);
  const demo = users.find((u) => u.username === "demo");
  const others = users.filter((u) => !u._id.equals(demo._id));
  const isFriend = (a, b) => a.friends.some((f) => f.equals(b._id));
  const befriend = (a, b) => {
    if (a._id.equals(b._id) || isFriend(a, b)) return;
    a.friends.push(b._id);
    b.friends.push(a._id);
  };
  for (const user of others) {
    for (const friend of pickSome(others.filter((u) => !u._id.equals(user._id)), between(4, 9))) {
      befriend(user, friend);
    }
  }
  const requesters = others.slice(-2);
  for (const user of others) {
    if (!requesters.includes(user)) befriend(demo, user);
  }
  requesters.forEach((u) => demo.friendRequests.push(u._id));
  users[1].friendRequests.push(users[9]._id);
  users[2].friendRequests.push(users[10]._id);
  await Promise.all(users.map((u) => u.save()));
  console.log("[seed] friendships and a few pending requests");
  const groups = [];
  for (let i = 0; i < GROUPS.length; i++) {
    const admin = GROUPS[i].isPrivate ? demo : others[i % others.length];
    const members = pickSome(others.filter((u) => !u._id.equals(admin._id)), between(8, 18));
    if (!admin._id.equals(demo._id)) members.push(demo);
    const waiting = GROUPS[i].isPrivate ? others.filter((u) => !members.includes(u) && !u._id.equals(admin._id)).slice(0, 3) : [];
    const group = await Group.create(Object.assign({}, GROUPS[i], {
      admin: admin._id,
      members: [admin._id, ...members.map((m) => m._id)],
      // put a few people in the queue for the private group so the approve
      // button has something to do when I demo it
      pendingRequests: waiting.map((u) => u._id)
    }));
    groups.push(group);
  }
  console.log(`[seed] ${groups.length} groups`);
  const cars = [];
  const DEMO_CARS = ["M3 E46", "Supra MK4", "GR86"];
  let next = 0;
  for (let i = 0; i < CARS.length; i++) {
    const owner = DEMO_CARS.includes(CARS[i].model) ? demo : others[next++ % others.length];
    cars.push(await Car.create(Object.assign({}, CARS[i], {
      owner: owner._id,
      description: ""
    })));
  }
  console.log(`[seed] ${cars.length} cars`);
  const events = [];
  const offsets = [
    -118,
    -112,
    -105,
    -101,
    -97,
    -92,
    -86,
    -81,
    -77,
    -74,
    -70,
    -66,
    -61,
    -57,
    -52,
    -48,
    -45,
    -41,
    -38,
    -33,
    -29,
    -26,
    -23,
    -20,
    -16,
    -12,
    -10,
    -8,
    -5,
    -2,
    1,
    3,
    5,
    6,
    9,
    11,
    13,
    16,
    18,
    20,
    23,
    25,
    27,
    30,
    34,
    38,
    43,
    47,
    55,
    62
  ];
  const demoHosts = [7, 21, 33, 40, 45];
  for (let i = 0; i < offsets.length; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const host = demoHosts.includes(i) ? demo : others[i % others.length];
    const attendees = pickSome(others.filter((u) => !u._id.equals(host._id)), between(5, 16));
    if (!host._id.equals(demo._id) && Math.random() < 0.6) attendees.push(demo);
    events.push(await Event.create({
      title: template.title,
      coverImage: template.coverImage,
      description: template.description,
      type: template.type,
      raceType: template.raceType || "",
      circuit: template.circuit || "",
      laps: template.laps || 1,
      host: host._id,
      group: Math.random() > 0.35 ? pick(groups)._id : null,
      startsAt: daysFromNow(offsets[i], between(8, 21)),
      city: template.city,
      address: template.address,
      location: point(template.city),
      // when there is a limit, keep it above the people already going
      maxAttendees: Math.random() > 0.6 ? attendees.length + 1 + between(2, 20) : 0,
      attendees: [host._id, ...attendees.map((a) => a._id)],
      likes: pickSome(users, between(2, 14)).map((u) => u._id),
      comments: pickSome(users, between(0, 4)).map((u) => ({ author: u._id, text: pick(EVENT_COMMENTS) }))
    }));
  }
  console.log(`[seed] ${events.length} events`);
  const DAY = 24 * 60 * 60 * 1e3;
  for (const ev of events) {
    const posted = Math.min(Date.now() - between(2, 360) * 60 * 60 * 1e3, ev.startsAt.getTime() - between(6, 18) * DAY);
    await Event.collection.updateOne({ _id: ev._id }, { $set: { createdAt: new Date(posted) } });
  }
  for (const car of cars) {
    const added = Date.now() - between(0, 20) * DAY - between(1, 23) * 60 * 60 * 1e3;
    await Car.collection.updateOne({ _id: car._id }, { $set: { createdAt: new Date(added) } });
  }
  const cities = ["Tel Aviv", "Haifa", "Beer Sheva", "Netanya", "Jerusalem", "Ashdod", "Herzliya", "Modiin"];
  const listings = [];
  const DEMO_LISTINGS = ["Bucket seat with rails", "Torque wrench set"];
  for (let i = 0; i < LISTINGS.length; i++) {
    const city = cities[i % cities.length];
    const seller = DEMO_LISTINGS.includes(LISTINGS[i].title) ? demo : others[(i * 3 + 1) % others.length];
    listings.push(await Listing.create(Object.assign({}, LISTINGS[i], {
      seller: seller._id,
      city,
      location: point(city),
      // mark a few as already sold so the sold badge shows up
      status: i % 9 === 0 ? "sold" : "available",
      likes: pickSome(users, between(1, 9)).map((u) => u._id),
      comments: pickSome(users.filter((u) => !u._id.equals(seller._id)), between(0, 3)).map((u) => ({ author: u._id, text: pick(LISTING_COMMENTS) }))
    })));
  }
  console.log(`[seed] ${listings.length} listings`);
  let messageCount = 0;
  async function talk(a, b, lines) {
    const start = daysFromNow(-between(1, 25), between(9, 21));
    for (let j = 0; j < lines.length; j++) {
      await Message.create({
        from: j % 2 === 0 ? a._id : b._id,
        to: j % 2 === 0 ? b._id : a._id,
        text: lines[j],
        read: j < lines.length - 1,
        createdAt: new Date(start.getTime() + j * between(2, 15) * 6e4)
      });
      messageCount++;
    }
  }
  for (let i = 0; i < CONVERSATIONS.length * 2; i++) {
    const a = others[i * 2 % others.length];
    const b = others[(i * 2 + 5) % others.length];
    await talk(a, b, CONVERSATIONS[i % CONVERSATIONS.length]);
  }
  const demoChats = pickSome(others, DEMO_CONVERSATIONS.length);
  for (let i = 0; i < DEMO_CONVERSATIONS.length; i++) {
    await talk(demoChats[i], demo, DEMO_CONVERSATIONS[i]);
  }
  console.log(`[seed] ${messageCount} chat messages`);
  console.log("\n  Seeding complete.");
  console.log('  Sign in with any member, the password is always "secret123":');
  console.log("    alon   (site administrator)");
  console.log('    demo   (or just press "Demo User" on the login page)');
  console.log("    " + others.filter((u) => u.username !== "alon").map((u) => u.username).join(", ") + "\n");
  await mongoose.disconnect();
}
seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
