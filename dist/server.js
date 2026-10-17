var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// config/db.jsx
var require_db = __commonJS({
  "config/db.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
    async function connectDB2() {
      const uri = process.env.MONGO_URI;
      if (!uri) {
        console.error("[db] Missing MONGO_URI. Copy .env.example to .env and set it.");
        process.exit(1);
      }
      try {
        await mongoose.connect(uri);
        console.log("[db] MongoDB connected");
        const started = Date.now();
        await mongoose.connection.db.admin().ping();
        console.log(`[db] one round trip to the database takes ${Date.now() - started} ms`);
      } catch (err) {
        console.error("[db] MongoDB connection error:", err.message);
        process.exit(1);
      }
    }
    module2.exports = connectDB2;
  }
});

// src/paths.jsx
var require_paths = __commonJS({
  "src/paths.jsx"(exports2, module2) {
    var path2 = require("path");
    var ROOT = process.env.APP_ROOT || process.cwd();
    module2.exports = {
      ROOT,
      VIEWS: path2.join(ROOT, "views"),
      PUBLIC: path2.join(ROOT, "public"),
      UPLOADS: path2.join(ROOT, "public", "uploads"),
      VIDEO: path2.join(ROOT, "public", "video")
    };
  }
});

// src/models/Group.jsx
var require_Group = __commonJS({
  "src/models/Group.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
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
    var groupSchema = new mongoose.Schema(
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
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        // people waiting for the admin to let them in
        isPrivate: { type: Boolean, default: false }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("Group", groupSchema);
    module2.exports.CATEGORIES = GROUP_CATEGORIES;
  }
});

// src/utils/wantsJson.jsx
var require_wantsJson = __commonJS({
  "src/utils/wantsJson.jsx"(exports2, module2) {
    function wantsJson(req) {
      return req.path.startsWith("/api") || req.xhr === true;
    }
    module2.exports = wantsJson;
  }
});

// src/models/User.jsx
var require_User = __commonJS({
  "src/models/User.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
    var bcrypt = require("bcryptjs");
    var userSchema = new mongoose.Schema(
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
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
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
    module2.exports = mongoose.model("User", userSchema);
  }
});

// src/middleware/auth.jsx
var require_auth = __commonJS({
  "src/middleware/auth.jsx"(exports2, module2) {
    var Group = require_Group();
    var wantsJson = require_wantsJson();
    async function attachUser2(req, res, next) {
      res.locals.currentUser = null;
      req.currentUser = null;
      res.locals.currentPath = req.path;
      if (!req.session || !req.session.userId) return next();
      try {
        const User = require_User();
        const user = await User.findById(req.session.userId);
        if (user) {
          req.currentUser = user;
          res.locals.currentUser = user;
        } else {
          req.session.destroy(() => {
          });
        }
      } catch (err) {
        return next(err);
      }
      next();
    }
    function requireLogin(req, res, next) {
      if (req.currentUser) return next();
      if (wantsJson(req)) {
        return res.status(401).json({ error: "You must be logged in to do that." });
      }
      return res.redirect("/login");
    }
    function requireAdmin(req, res, next) {
      if (req.currentUser && req.currentUser.role === "admin") return next();
      if (wantsJson(req)) {
        return res.status(403).json({ error: "Administrator access required." });
      }
      return res.status(403).render("pages/error", {
        title: "Forbidden",
        message: "Administrator access required."
      });
    }
    async function requireGroupAdmin(req, res, next) {
      try {
        const group = await Group.findById(req.params.id || req.params.groupId);
        if (!group) {
          return res.status(404).json({ error: "Group not found." });
        }
        const isOwner = group.admin.equals(req.currentUser._id);
        const isSiteAdmin = req.currentUser.role === "admin";
        if (!isOwner && !isSiteAdmin) {
          return res.status(403).json({ error: "Only the group manager can do that." });
        }
        req.group = group;
        next();
      } catch (err) {
        next(err);
      }
    }
    function requireGuest(req, res, next) {
      if (req.currentUser) return res.redirect("/feed");
      next();
    }
    module2.exports = { attachUser: attachUser2, requireLogin, requireAdmin, requireGroupAdmin, requireGuest };
  }
});

// src/middleware/error.jsx
var require_error = __commonJS({
  "src/middleware/error.jsx"(exports2, module2) {
    var wantsJson = require_wantsJson();
    function notFound2(req, res) {
      if (wantsJson(req)) {
        return res.status(404).json({ error: "Not found." });
      }
      return res.status(404).render("pages/error", {
        title: "Page not found",
        message: "The page you were looking for does not exist."
      });
    }
    function errorHandler2(err, req, res, next) {
      console.error("[error]", err.message);
      let status = err.status || 500;
      let message = "Something went wrong. Please try again.";
      if (err.name === "ValidationError") {
        status = 400;
        message = Object.values(err.errors)[0].message;
      } else if (err.name === "CastError") {
        status = 400;
        message = "Invalid value provided.";
      } else if (err.code === 11e3) {
        status = 409;
        const field = Object.keys(err.keyValue || { value: "" })[0];
        message = `That ${field} is already taken.`;
      } else if (err.code === "LIMIT_FILE_SIZE") {
        status = 400;
        message = "The uploaded file is too large (max 2MB).";
      } else if (err.status && err.expose) {
        message = err.message;
      }
      if (wantsJson(req)) {
        return res.status(status).json({ error: message });
      }
      return res.status(status).render("pages/error", { title: "Error", message });
    }
    module2.exports = { notFound: notFound2, errorHandler: errorHandler2 };
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
    function coordinatesOf(cityName) {
      const city = CITIES.find((c) => c.name === cityName);
      return city ? city.coordinates : null;
    }
    module2.exports = { CITIES, CITY_NAMES, coordinatesOf };
  }
});

// src/models/Setting.jsx
var require_Setting = __commonJS({
  "src/models/Setting.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
    var settingSchema = new mongoose.Schema(
      {
        key: { type: String, required: true, unique: true },
        value: { type: String, default: "" }
      },
      { timestamps: true }
      // updatedAt tells us how old the value is
    );
    module2.exports = mongoose.model("Setting", settingSchema);
  }
});

// src/utils/recap.jsx
var require_recap = __commonJS({
  "src/utils/recap.jsx"(exports2, module2) {
    var Setting = require_Setting();
    var SERIES = [
      { key: "recapVideo", name: "GT World", channelId: "UC-yHapH6mW1ceZ_5PDUf1_g", handle: "GTWorld", embed: true },
      { key: "recapVideo:f1", name: "Formula 1", channelId: "UCB_qr75-ydFVKSF9Dmo6izg", handle: "Formula1", embed: false },
      { key: "recapVideo:nascar", name: "NASCAR", channelId: "UCuN9hYw2RpoAW8rZ3VK3isA", handle: "NASCAR", embed: true }
    ];
    var THREE_DAYS = 3 * 24 * 60 * 60 * 1e3;
    function parseFeed(xml) {
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      return entries.map((entry) => {
        const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        const title = entry.match(/<title>([^<]+)<\/title>/);
        return { id: id ? id[1] : "", title: title ? decode(title[1]) : "" };
      }).filter((v) => v.id);
    }
    function decode(text) {
      return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    }
    async function isShort(id) {
      const res = await fetch("https://www.youtube.com/shorts/" + id, {
        method: "HEAD",
        redirect: "manual"
      });
      return res.status === 200;
    }
    async function fetchLatest(channelId) {
      const res = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId);
      if (!res.ok) throw new Error("feed answered " + res.status);
      const videos = parseFeed(await res.text());
      if (!videos.length) throw new Error("no video in the feed");
      for (const video of videos) {
        if (!await isShort(video.id)) return video;
      }
      throw new Error("only shorts in the feed");
    }
    async function refresh(series) {
      try {
        const latest = await fetchLatest(series.channelId);
        await Setting.findOneAndUpdate(
          { key: series.key },
          { value: JSON.stringify(latest) },
          { upsert: true }
        );
        console.log("[recap] latest " + series.name + " video is " + latest.id + " (" + latest.title + ")");
        return latest;
      } catch (err) {
        console.log("[recap] could not check YouTube for " + series.name + ": " + err.message);
        return null;
      }
    }
    async function latestFor(series) {
      const saved = await Setting.findOne({ key: series.key });
      const fresh = saved && Date.now() - saved.updatedAt.getTime() < THREE_DAYS;
      if (!fresh) {
        if (saved && saved.value) {
          refresh(series);
        } else {
          const latest = await refresh(series);
          if (latest) return latest;
        }
      }
      if (saved && saved.value) return JSON.parse(saved.value);
      if (series.key === "recapVideo") return { id: process.env.RECAP_YOUTUBE_ID || "", title: "" };
      return { id: "", title: "" };
    }
    async function latestRecaps() {
      return Promise.all(SERIES.map(async (series) => Object.assign(
        { series: series.name, embed: series.embed, channelUrl: "https://www.youtube.com/@" + series.handle + "/videos" },
        await latestFor(series)
      )));
    }
    module2.exports = { latestRecaps };
  }
});

// src/routes/index.jsx
var require_routes = __commonJS({
  "src/routes/index.jsx"(exports2, module2) {
    var express2 = require("express");
    var { requireLogin } = require_auth();
    var { CITIES } = require_cities();
    var { latestRecaps } = require_recap();
    var router = express2.Router();
    router.get("/", (req, res) => {
      if (req.currentUser) return res.redirect("/feed");
      res.render("pages/landing", { title: "Home" });
    });
    router.get("/search", requireLogin, (req, res) => {
      res.render("pages/search", { title: "Search", cities: CITIES });
    });
    router.get("/motorsport", requireLogin, async (req, res, next) => {
      try {
        res.render("pages/motorsport", {
          title: "Motorsport",
          videos: await latestRecaps()
        });
      } catch (err) {
        next(err);
      }
    });
    module2.exports = router;
  }
});

// src/controllers/authController.jsx
var require_authController = __commonJS({
  "src/controllers/authController.jsx"(exports2, module2) {
    var User = require_User();
    function showRegister(req, res) {
      res.render("pages/register", { title: "Create account" });
    }
    function showLogin(req, res) {
      res.render("pages/login", { title: "Sign in" });
    }
    async function register(req, res, next) {
      try {
        const { username, password, displayName, location, bio } = req.body;
        const exists = await User.findOne({ username: String(username).toLowerCase() });
        if (exists) {
          return res.status(409).json({ error: "That username is already taken." });
        }
        const user = await User.create({
          username,
          password,
          // hashed by the pre-save hook in the model
          displayName: displayName || username,
          location: location || "",
          bio: bio || ""
        });
        req.session.userId = user._id;
        return res.status(201).json({ ok: true, redirect: "/feed" });
      } catch (err) {
        next(err);
      }
    }
    async function login(req, res, next) {
      try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: String(username).toLowerCase() }).select("+password");
        if (!user || !await user.comparePassword(password)) {
          return res.status(401).json({ error: "Incorrect username or password." });
        }
        req.session.userId = user._id;
        return res.json({ ok: true, redirect: "/feed" });
      } catch (err) {
        next(err);
      }
    }
    var DEMO_USERNAME = "demo";
    async function demoLogin(req, res, next) {
      try {
        let user = await User.findOne({ username: DEMO_USERNAME });
        if (!user) {
          user = await User.create({
            username: DEMO_USERNAME,
            password: require("crypto").randomBytes(24).toString("hex"),
            displayName: "Demo Driver",
            location: "Tel Aviv",
            bio: "The demo account. Look around, everything here is test data."
          });
        }
        req.session.userId = user._id;
        return res.json({ ok: true, redirect: "/feed" });
      } catch (err) {
        next(err);
      }
    }
    function logout(req, res) {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true, redirect: "/" });
      });
    }
    module2.exports = { showRegister, showLogin, register, login, demoLogin, logout };
  }
});

// src/middleware/validate.jsx
var require_validate = __commonJS({
  "src/middleware/validate.jsx"(exports2, module2) {
    var { validationResult } = require("express-validator");
    var wantsJson = require_wantsJson();
    function handleValidation(req, res, next) {
      const result = validationResult(req);
      if (result.isEmpty()) return next();
      const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
      if (wantsJson(req)) {
        return res.status(400).json({ error: errors[0].message, errors });
      }
      return res.status(400).render("pages/error", {
        title: "Invalid input",
        message: errors.map((e) => e.message).join(", ")
      });
    }
    function validateObjectId(paramName = "id") {
      return function checkId(req, res, next) {
        const value = req.params[paramName];
        if (!/^[0-9a-fA-F]{24}$/.test(value)) {
          return res.status(400).json({ error: "Invalid id." });
        }
        next();
      };
    }
    module2.exports = { handleValidation, validateObjectId };
  }
});

// src/routes/auth.jsx
var require_auth2 = __commonJS({
  "src/routes/auth.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var auth = require_authController();
    var { handleValidation } = require_validate();
    var { requireGuest, requireLogin } = require_auth();
    var router = express2.Router();
    var registerRules = [
      body("username").trim().isLength({ min: 3, max: 20 }).withMessage("Username must be 3-20 characters").matches(/^[a-zA-Z0-9_]+$/).withMessage("Username may only contain letters, numbers and underscore"),
      body("password").isLength({ min: 6, max: 100 }).withMessage("Password must be at least 6 characters"),
      body("displayName").optional().trim().isLength({ max: 40 }).withMessage("Display name is too long"),
      body("location").optional().trim().isLength({ max: 60 }).withMessage("Location is too long"),
      body("bio").optional().trim().isLength({ max: 300 }).withMessage("Bio is too long")
    ];
    var loginRules = [
      body("username").trim().notEmpty().withMessage("Username is required"),
      body("password").notEmpty().withMessage("Password is required")
    ];
    router.get("/register", requireGuest, auth.showRegister);
    router.get("/login", requireGuest, auth.showLogin);
    router.post("/auth/register", requireGuest, registerRules, handleValidation, auth.register);
    router.post("/auth/login", requireGuest, loginRules, handleValidation, auth.login);
    router.post("/auth/demo", requireGuest, auth.demoLogin);
    router.post("/auth/logout", requireLogin, auth.logout);
    module2.exports = router;
  }
});

// src/models/commentSchema.jsx
var require_commentSchema = __commonJS({
  "src/models/commentSchema.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
    var commentSchema = new mongoose.Schema(
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    var mongoose = require("mongoose");
    var commentSchema = require_commentSchema();
    var { CITY_NAMES } = require_cities();
    var { CIRCUIT_IDS } = require_circuits();
    var EVENT_TYPES = ["meet", "race"];
    var RACE_TYPES = ["Drag", "Track", "Rally", "Hillclimb", "Drift", "Time attack"];
    var eventSchema = new mongoose.Schema(
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
        host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
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
        attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema]
      },
      { timestamps: true }
    );
    eventSchema.index({ location: "2dsphere" });
    eventSchema.index({ startsAt: 1 });
    module2.exports = mongoose.model("Event", eventSchema);
    module2.exports.EVENT_TYPES = EVENT_TYPES;
    module2.exports.RACE_TYPES = RACE_TYPES;
  }
});

// src/models/Car.jsx
var require_Car = __commonJS({
  "src/models/Car.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
    var CAR_CATEGORIES = ["Sedan", "Hatchback", "SUV", "Coupe", "Convertible", "Pickup", "Van", "Other"];
    var carSchema = new mongoose.Schema(
      {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    module2.exports = mongoose.model("Car", carSchema);
    module2.exports.CATEGORIES = CAR_CATEGORIES;
  }
});

// src/utils/query.jsx
var require_query = __commonJS({
  "src/utils/query.jsx"(exports2, module2) {
    function escapeRegex(text) {
      return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function contains(text) {
      return new RegExp(escapeRegex(String(text).trim()), "i");
    }
    function paginate(reqQuery, defaultLimit = 20, maxLimit = 50) {
      const page = Math.max(1, parseInt(reqQuery.page, 10) || 1);
      const limit = Math.min(maxLimit, Math.max(1, parseInt(reqQuery.limit, 10) || defaultLimit));
      return { page, limit, skip: (page - 1) * limit };
    }
    function num(value) {
      if (value === void 0 || value === null || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    function date(value) {
      if (!value) return null;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    module2.exports = { escapeRegex, contains, paginate, num, date };
  }
});

// src/controllers/feedController.jsx
var require_feedController = __commonJS({
  "src/controllers/feedController.jsx"(exports2, module2) {
    var Event = require_Event();
    var Group = require_Group();
    var User = require_User();
    var Car = require_Car();
    var { paginate } = require_query();
    function showFeed(req, res) {
      res.render("pages/feed", { title: "Feed" });
    }
    async function circleOf(user) {
      const groups = await Group.find({ members: user._id }).select("_id");
      return {
        groupIds: groups.map((g) => g._id),
        // me plus everyone I am friends with
        peopleIds: [user._id, ...user.friends]
      };
    }
    async function feed(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query, 12, 40);
        const me = req.currentUser;
        const [{ groupIds, peopleIds }, privateGroups] = await Promise.all([
          circleOf(me),
          Group.find({ isPrivate: true }).select("_id members admin")
        ]);
        const filter = req.query.filter || "all";
        const eventOr = [];
        if (filter === "all" || filter === "friends") eventOr.push({ host: { $in: peopleIds } });
        if (filter === "all" || filter === "groups") eventOr.push({ group: { $in: groupIds } });
        const carMatch = filter === "groups" ? null : { owner: { $in: peopleIds } };
        const hidden = privateGroups.filter((g) => me.role !== "admin" && !g.admin.equals(me._id) && !g.members.some((m) => m.equals(me._id))).map((g) => g._id);
        const [events, garageCars] = await Promise.all([
          eventOr.length ? Event.find(hidden.length ? { $and: [{ $or: eventOr }, { group: { $nin: hidden } }] } : { $or: eventOr }).populate("host", "username displayName avatar location").populate("group", "name").sort({ createdAt: -1 }).limit(skip + limit) : [],
          carMatch ? Car.find(carMatch).populate("owner", "username displayName avatar location").sort({ createdAt: -1 }).limit(skip + limit) : []
        ]);
        const items = events.map((e) => ({ kind: "event", createdAt: e.createdAt, data: e })).concat(garageCars.map((c) => ({ kind: "car", createdAt: c.createdAt, data: c }))).sort((a, b) => b.createdAt - a.createdAt);
        const pageItems = items.slice(skip, skip + limit);
        const posterOf = (item) => item.kind === "event" ? item.data.host : item.data.owner;
        const posterIds = pageItems.map(posterOf).filter(Boolean).map((person) => person._id);
        const cars = await Car.find({ owner: { $in: posterIds } }).select("owner make model year photo").sort({ createdAt: 1 });
        const carOf = {};
        cars.forEach((car) => {
          if (!carOf[car.owner]) carOf[car.owner] = car;
        });
        const withCars = pageItems.map((item) => {
          const person = posterOf(item);
          return Object.assign({}, item, { car: person ? carOf[person._id] || null : null });
        });
        res.json({
          items: withCars,
          total: items.length,
          page,
          hasMore: items.length > skip + limit,
          // the page uses this to explain why the feed is empty for a brand new user
          circle: { friends: me.friends.length, groups: groupIds.length }
        });
      } catch (err) {
        next(err);
      }
    }
    async function suggestions(req, res, next) {
      try {
        const me = req.currentUser;
        const people = await User.find({
          _id: { $nin: [me._id, ...me.friends] },
          friendRequests: { $ne: me._id }
          // do not suggest people we already asked
        }).select("username displayName avatar location").limit(5);
        const myGroups = await Group.find({ members: me._id }).select("name");
        res.json({ suggestions: people, groups: myGroups });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = { showFeed, feed, suggestions };
  }
});

// src/routes/feed.jsx
var require_feed = __commonJS({
  "src/routes/feed.jsx"(exports2, module2) {
    var express2 = require("express");
    var feed = require_feedController();
    var { requireLogin } = require_auth();
    var router = express2.Router();
    router.use(requireLogin);
    router.get("/feed", feed.showFeed);
    router.get("/api/feed", feed.feed);
    router.get("/api/feed/suggestions", feed.suggestions);
    module2.exports = router;
  }
});

// src/models/Listing.jsx
var require_Listing = __commonJS({
  "src/models/Listing.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
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
    var listingSchema = new mongoose.Schema(
      {
        seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema]
      },
      { timestamps: true }
    );
    listingSchema.index({ location: "2dsphere" });
    listingSchema.index({ price: 1 });
    module2.exports = mongoose.model("Listing", listingSchema);
    module2.exports.CATEGORIES = LISTING_CATEGORIES;
    module2.exports.CONDITIONS = CONDITIONS;
  }
});

// src/controllers/userController.jsx
var require_userController = __commonJS({
  "src/controllers/userController.jsx"(exports2, module2) {
    var User = require_User();
    var Car = require_Car();
    var Event = require_Event();
    var Listing = require_Listing();
    var Group = require_Group();
    var { contains, paginate } = require_query();
    async function showProfile(req, res, next) {
      try {
        const user = await User.findOne({ username: String(req.params.username).toLowerCase() }).populate("friends", "username displayName avatar");
        if (!user) {
          return res.status(404).render("pages/error", {
            title: "Member not found",
            message: "No member with that username."
          });
        }
        const [cars, eventCount, listingCount, groups] = await Promise.all([
          Car.find({ owner: user._id }).sort({ createdAt: -1 }),
          Event.countDocuments({ host: user._id }),
          Listing.countDocuments({ seller: user._id }),
          Group.find({ members: user._id }).select("name category")
        ]);
        const isSelf = user._id.equals(req.currentUser._id);
        const isFriend = user.friends.some((f) => f._id.equals(req.currentUser._id));
        const requestSent = user.friendRequests.some((f) => f.equals(req.currentUser._id));
        res.render("pages/profile", {
          title: user.displayName || user.username,
          user,
          cars,
          eventCount,
          listingCount,
          groups,
          isSelf,
          isFriend,
          requestSent
        });
      } catch (err) {
        next(err);
      }
    }
    async function list(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const [users, total] = await Promise.all([
          User.find().select("username displayName avatar location bio friends createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
          User.countDocuments()
        ]);
        res.json({ users, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function search(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const { username, location, keyword, carMake } = req.query;
        const filter = {};
        if (username && username.trim()) {
          filter.$or = [{ username: contains(username) }, { displayName: contains(username) }];
        }
        if (location && location.trim()) filter.location = contains(location);
        if (keyword && keyword.trim()) filter.bio = contains(keyword);
        if (carMake && carMake.trim()) {
          const owners = await Car.find({ make: contains(carMake) }).distinct("owner");
          filter._id = { $in: owners };
        }
        const [users, total] = await Promise.all([
          User.find(filter).select("username displayName avatar location bio friends createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
          User.countDocuments(filter)
        ]);
        res.json({ users, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
      } catch (err) {
        next(err);
      }
    }
    async function getOne(req, res, next) {
      try {
        const isSelf = String(req.params.id) === String(req.currentUser._id);
        const fields = "username displayName avatar location bio friends createdAt" + (isSelf ? " friendRequests" : "");
        const user = await User.findById(req.params.id).select(fields);
        if (!user) return res.status(404).json({ error: "Member not found." });
        res.json({ user });
      } catch (err) {
        next(err);
      }
    }
    async function update(req, res, next) {
      try {
        if (req.params.id !== String(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "You can only edit your own profile." });
        }
        const user = await User.findById(req.params.id).select("+password");
        if (!user) return res.status(404).json({ error: "Member not found." });
        ["displayName", "bio", "location", "avatar"].forEach((field) => {
          if (req.body[field] !== void 0) user[field] = req.body[field];
        });
        if (req.body.newPassword) {
          if (req.currentUser.role !== "admin") {
            const ok = await user.comparePassword(req.body.currentPassword || "");
            if (!ok) return res.status(401).json({ error: "Your current password is incorrect." });
          }
          user.password = req.body.newPassword;
        }
        await user.save();
        res.json({
          ok: true,
          user: {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            location: user.location,
            avatar: user.avatar
          }
        });
      } catch (err) {
        next(err);
      }
    }
    async function remove(req, res, next) {
      try {
        if (req.params.id !== String(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "You can only delete your own account." });
        }
        const id = req.params.id;
        await Promise.all([
          Car.deleteMany({ owner: id }),
          Event.deleteMany({ host: id }),
          Listing.deleteMany({ seller: id }),
          User.updateMany({ friends: id }, { $pull: { friends: id } }),
          Group.updateMany({ members: id }, { $pull: { members: id } })
        ]);
        const managed = await Group.find({ admin: id }).select("_id");
        if (managed.length) {
          const ids = managed.map((g) => g._id);
          await Event.deleteMany({ group: { $in: ids } });
          await Group.deleteMany({ _id: { $in: ids } });
        }
        await User.findByIdAndDelete(id);
        if (String(req.currentUser._id) === id) {
          return req.session.destroy(() => res.json({ ok: true, redirect: "/" }));
        }
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function sendFriendRequest(req, res, next) {
      try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ error: "Member not found." });
        const meId = req.currentUser._id;
        if (target._id.equals(meId)) {
          return res.status(400).json({ error: "You cannot add yourself." });
        }
        if (target.friends.some((f) => f.equals(meId))) {
          return res.status(409).json({ error: "You are already friends." });
        }
        if (target.friendRequests.some((f) => f.equals(meId))) {
          return res.status(409).json({ error: "Request already sent." });
        }
        target.friendRequests.push(meId);
        await target.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function acceptFriendRequest(req, res, next) {
      try {
        const me = await User.findById(req.currentUser._id);
        const other = await User.findById(req.params.id);
        if (!other) return res.status(404).json({ error: "Member not found." });
        if (!me.friendRequests.some((f) => f.equals(other._id))) {
          return res.status(404).json({ error: "No pending request from that member." });
        }
        me.friendRequests = me.friendRequests.filter((f) => !f.equals(other._id));
        if (!me.friends.some((f) => f.equals(other._id))) me.friends.push(other._id);
        if (!other.friends.some((f) => f.equals(me._id))) other.friends.push(me._id);
        await Promise.all([me.save(), other.save()]);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function unfriend(req, res, next) {
      try {
        const me = await User.findById(req.currentUser._id);
        const other = await User.findById(req.params.id);
        if (!other) return res.status(404).json({ error: "Member not found." });
        me.friends = me.friends.filter((f) => !f.equals(other._id));
        other.friends = other.friends.filter((f) => !f.equals(me._id));
        await Promise.all([me.save(), other.save()]);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = {
      showProfile,
      list,
      search,
      getOne,
      update,
      remove,
      sendFriendRequest,
      acceptFriendRequest,
      unfriend
    };
  }
});

// src/routes/users.jsx
var require_users = __commonJS({
  "src/routes/users.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var users = require_userController();
    var { requireLogin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    var profileRules = [
      body("displayName").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("Display name is too long"),
      body("bio").optional({ values: "falsy" }).isLength({ max: 300 }).withMessage("Bio is too long"),
      body("location").optional({ values: "falsy" }).isLength({ max: 60 }).withMessage("Location is too long"),
      body("newPassword").optional({ values: "falsy" }).isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
    ];
    router.use(requireLogin);
    router.get("/profile/:username", users.showProfile);
    router.get("/api/users/search", users.search);
    router.get("/api/users", users.list);
    router.get("/api/users/:id", validateObjectId(), users.getOne);
    router.put("/api/users/:id", validateObjectId(), profileRules, handleValidation, users.update);
    router.delete("/api/users/:id", validateObjectId(), users.remove);
    router.post("/api/users/:id/friend-request", validateObjectId(), users.sendFriendRequest);
    router.post("/api/users/:id/accept", validateObjectId(), users.acceptFriendRequest);
    router.post("/api/users/:id/unfriend", validateObjectId(), users.unfriend);
    module2.exports = router;
  }
});

// src/controllers/groupController.jsx
var require_groupController = __commonJS({
  "src/controllers/groupController.jsx"(exports2, module2) {
    var Group = require_Group();
    var Event = require_Event();
    var { contains, paginate, num } = require_query();
    function showGroups(req, res) {
      res.render("pages/groups", { title: "Groups", categories: Group.CATEGORIES });
    }
    async function showGroup(req, res, next) {
      try {
        const group = await Group.findById(req.params.id).populate("admin", "username displayName avatar").populate("members", "username displayName avatar").populate("pendingRequests", "username displayName avatar");
        if (!group) {
          return res.status(404).render("pages/error", {
            title: "Group not found",
            message: "That group does not exist."
          });
        }
        const me = req.currentUser;
        const isMember = group.members.some((m) => m._id.equals(me._id));
        const isManager = group.admin._id.equals(me._id);
        if (group.isPrivate && !isMember && !isManager && me.role !== "admin") {
          return res.status(403).render("pages/error", {
            title: "Private group",
            message: "This group is private. Ask the manager to approve your request to join."
          });
        }
        res.render("pages/group", {
          title: group.name,
          group,
          isMember,
          isManager: isManager || me.role === "admin"
        });
      } catch (err) {
        next(err);
      }
    }
    async function list(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const filter = {};
        if (req.query.mine === "true") {
          filter.$or = [{ members: req.currentUser._id }, { admin: req.currentUser._id }];
        }
        const [groups, total] = await Promise.all([
          Group.find(filter).populate("admin", "username displayName avatar").sort({ createdAt: -1 }).skip(skip).limit(limit),
          Group.countDocuments(filter)
        ]);
        res.json({ groups, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function search(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const { name, category, brand, privacy, minMembers } = req.query;
        const filter = {};
        if (name && name.trim()) filter.name = contains(name);
        if (brand && brand.trim()) filter.brand = contains(brand);
        if (category && Group.CATEGORIES.includes(category)) filter.category = category;
        if (privacy === "public") filter.isPrivate = false;
        if (privacy === "private") filter.isPrivate = true;
        const min = num(minMembers);
        if (min !== null && min > 0) filter[`members.${min - 1}`] = { $exists: true };
        const [groups, total] = await Promise.all([
          Group.find(filter).populate("admin", "username displayName avatar").sort({ createdAt: -1 }).skip(skip).limit(limit),
          Group.countDocuments(filter)
        ]);
        res.json({ groups, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
      } catch (err) {
        next(err);
      }
    }
    async function create(req, res, next) {
      try {
        const { name, description, category, brand, isPrivate, coverImage } = req.body;
        const group = await Group.create({
          name,
          description,
          category,
          brand,
          isPrivate: Boolean(isPrivate),
          coverImage: coverImage || void 0,
          admin: req.currentUser._id,
          members: [req.currentUser._id]
        });
        await group.populate("admin", "username displayName avatar");
        res.status(201).json({ ok: true, group });
      } catch (err) {
        next(err);
      }
    }
    async function update(req, res, next) {
      try {
        const group = req.group;
        const allowed = ["name", "description", "category", "brand", "isPrivate", "coverImage"];
        allowed.forEach((field) => {
          if (req.body[field] !== void 0) group[field] = req.body[field];
        });
        await group.save();
        await group.populate("admin", "username displayName avatar");
        res.json({ ok: true, group });
      } catch (err) {
        next(err);
      }
    }
    async function remove(req, res, next) {
      try {
        await Event.deleteMany({ group: req.group._id });
        await req.group.deleteOne();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function join(req, res, next) {
      try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: "Group not found." });
        const meId = req.currentUser._id;
        if (group.members.some((m) => m.equals(meId))) {
          return res.status(409).json({ error: "You are already a member." });
        }
        if (group.isPrivate) {
          if (group.pendingRequests.some((m) => m.equals(meId))) {
            return res.status(409).json({ error: "Your request is already waiting for approval." });
          }
          group.pendingRequests.push(meId);
          await group.save();
          return res.json({ ok: true, pending: true, message: "Request sent to the group manager." });
        }
        group.members.push(meId);
        await group.save();
        res.json({ ok: true, joined: true });
      } catch (err) {
        next(err);
      }
    }
    async function leave(req, res, next) {
      try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: "Group not found." });
        if (group.admin.equals(req.currentUser._id)) {
          return res.status(400).json({ error: "The manager cannot leave their own group." });
        }
        group.members = group.members.filter((m) => !m.equals(req.currentUser._id));
        await group.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function approve(req, res, next) {
      try {
        const group = req.group;
        const { userId } = req.body;
        if (!group.pendingRequests.some((m) => m.equals(userId))) {
          return res.status(404).json({ error: "No pending request from that member." });
        }
        group.pendingRequests = group.pendingRequests.filter((m) => !m.equals(userId));
        if (!group.members.some((m) => m.equals(userId))) group.members.push(userId);
        await group.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function reject(req, res, next) {
      try {
        const group = req.group;
        group.pendingRequests = group.pendingRequests.filter((m) => !m.equals(req.body.userId));
        await group.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function removeMember(req, res, next) {
      try {
        const group = req.group;
        const { userId } = req.body;
        if (group.admin.equals(userId)) {
          return res.status(400).json({ error: "The manager cannot be removed." });
        }
        group.members = group.members.filter((m) => !m.equals(userId));
        await group.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = {
      showGroups,
      showGroup,
      list,
      search,
      create,
      update,
      remove,
      join,
      leave,
      approve,
      reject,
      removeMember
    };
  }
});

// src/routes/groups.jsx
var require_groups = __commonJS({
  "src/routes/groups.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var groups = require_groupController();
    var Group = require_Group();
    var { requireLogin, requireGroupAdmin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    var groupRules = [
      body("name").trim().notEmpty().withMessage("Group name is required").isLength({ min: 2, max: 50 }).withMessage("Group name must be 2-50 characters"),
      body("description").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("Description is too long"),
      body("category").optional({ values: "falsy" }).isIn(Group.CATEGORIES).withMessage("Unknown category"),
      body("brand").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("Brand is too long")
    ];
    var memberRule = [body("userId").isMongoId().withMessage("Invalid member id")];
    router.use(requireLogin);
    router.get("/groups", groups.showGroups);
    router.get("/groups/:id", validateObjectId(), groups.showGroup);
    router.get("/api/groups/search", groups.search);
    router.get("/api/groups", groups.list);
    router.post("/api/groups", groupRules, handleValidation, groups.create);
    router.put("/api/groups/:id", validateObjectId(), requireGroupAdmin, groupRules, handleValidation, groups.update);
    router.delete("/api/groups/:id", validateObjectId(), requireGroupAdmin, groups.remove);
    router.post("/api/groups/:id/join", validateObjectId(), groups.join);
    router.post("/api/groups/:id/leave", validateObjectId(), groups.leave);
    router.post("/api/groups/:id/approve", validateObjectId(), requireGroupAdmin, memberRule, handleValidation, groups.approve);
    router.post("/api/groups/:id/reject", validateObjectId(), requireGroupAdmin, memberRule, handleValidation, groups.reject);
    router.post("/api/groups/:id/remove-member", validateObjectId(), requireGroupAdmin, memberRule, handleValidation, groups.removeMember);
    module2.exports = router;
  }
});

// src/controllers/eventController.jsx
var require_eventController = __commonJS({
  "src/controllers/eventController.jsx"(exports2, module2) {
    var Event = require_Event();
    var Group = require_Group();
    var { CITIES, coordinatesOf } = require_cities();
    var { CIRCUITS, circuitById } = require_circuits();
    var { contains, paginate, num, date } = require_query();
    async function hiddenGroupIds(user) {
      const privateGroups = await Group.find({ isPrivate: true }).select("_id members admin");
      return privateGroups.filter((g) => {
        if (user.role === "admin") return false;
        if (g.admin.equals(user._id)) return false;
        return !g.members.some((m) => m.equals(user._id));
      }).map((g) => g._id);
    }
    function applyPrivacy(filter, hidden, requestedGroup) {
      if (requestedGroup) {
        if (hidden.some((id) => id.equals(requestedGroup))) return false;
        return true;
      }
      if (hidden.length) filter.group = { $nin: hidden };
      return true;
    }
    function showEvents(req, res) {
      res.render("pages/events", {
        title: "Meets & races",
        cities: CITIES.map((c) => c.name),
        raceTypes: Event.RACE_TYPES,
        circuits: CIRCUITS
      });
    }
    async function showEvent(req, res, next) {
      try {
        const event = await Event.findById(req.params.id).populate("host", "username displayName avatar").populate("group", "name").populate("attendees", "username displayName avatar").populate("comments.author", "username displayName avatar");
        if (!event) {
          return res.status(404).render("pages/error", {
            title: "Event not found",
            message: "That meet or race does not exist."
          });
        }
        res.render("pages/event", {
          title: event.title,
          event,
          // the full track details, or null for a meet
          circuit: event.type === "race" ? circuitById(event.circuit) : null,
          isHost: event.host._id.equals(req.currentUser._id),
          isAttending: event.attendees.some((a) => a._id.equals(req.currentUser._id))
        });
      } catch (err) {
        next(err);
      }
    }
    async function list(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const filter = {};
        if (req.query.mine === "true") filter.host = req.currentUser._id;
        if (req.query.attending === "true") filter.attendees = req.currentUser._id;
        if (req.query.group) filter.group = req.query.group;
        if (req.query.type && Event.EVENT_TYPES.includes(req.query.type)) filter.type = req.query.type;
        const hidden = await hiddenGroupIds(req.currentUser);
        if (!applyPrivacy(filter, hidden, req.query.group)) {
          return res.status(403).json({ error: "This group is private." });
        }
        filter.startsAt = req.query.past === "true" ? { $lt: /* @__PURE__ */ new Date() } : { $gte: /* @__PURE__ */ new Date() };
        const sort = req.query.past === "true" ? { startsAt: -1 } : { startsAt: 1 };
        const [events, total] = await Promise.all([
          Event.find(filter).populate("host", "username displayName avatar").populate("group", "name").sort(sort).skip(skip).limit(limit),
          Event.countDocuments(filter)
        ]);
        res.json({ events, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function search(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const { keyword, type, raceType, city, dateFrom, dateTo, includePast } = req.query;
        const filter = {};
        if (keyword && keyword.trim()) {
          filter.$or = [{ title: contains(keyword) }, { description: contains(keyword) }];
        }
        if (type && Event.EVENT_TYPES.includes(type)) filter.type = type;
        if (raceType && Event.RACE_TYPES.includes(raceType)) filter.raceType = raceType;
        if (city && coordinatesOf(city)) filter.city = city;
        const from = date(dateFrom);
        const to = date(dateTo);
        if (from || to) {
          filter.startsAt = {};
          if (from) filter.startsAt.$gte = from;
          if (to) filter.startsAt.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1e3 - 1);
        } else if (includePast !== "true") {
          filter.startsAt = { $gte: /* @__PURE__ */ new Date() };
        }
        const hidden = await hiddenGroupIds(req.currentUser);
        if (!applyPrivacy(filter, hidden, req.query.group)) {
          return res.status(403).json({ error: "This group is private." });
        }
        const [events, total] = await Promise.all([
          Event.find(filter).populate("host", "username displayName avatar").populate("group", "name").sort({ startsAt: 1 }).skip(skip).limit(limit),
          Event.countDocuments(filter)
        ]);
        res.json({ events, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
      } catch (err) {
        next(err);
      }
    }
    async function searchArea(req, res, next) {
      try {
        const { polygon, type, dateFrom, dateTo, includePast } = req.body;
        if (!Array.isArray(polygon) || polygon.length < 3) {
          return res.status(400).json({ error: "Draw an area with at least three points." });
        }
        const clean = polygon.map((p) => {
          if (!Array.isArray(p) || p.length !== 2) throw Object.assign(new Error("Bad point"), { status: 400, expose: true });
          const lng = Number(p[0]);
          const lat = Number(p[1]);
          if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            throw Object.assign(new Error("Point is outside the world"), { status: 400, expose: true });
          }
          return [lng, lat];
        });
        const first = clean[0];
        const last = clean[clean.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) clean.push([first[0], first[1]]);
        const filter = {
          location: {
            $geoWithin: { $geometry: { type: "Polygon", coordinates: [clean] } }
          }
        };
        if (type && Event.EVENT_TYPES.includes(type)) filter.type = type;
        const from = date(dateFrom);
        const to = date(dateTo);
        if (from || to) {
          filter.startsAt = {};
          if (from) filter.startsAt.$gte = from;
          if (to) filter.startsAt.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1e3 - 1);
        } else if (includePast !== true && includePast !== "true") {
          filter.startsAt = { $gte: /* @__PURE__ */ new Date() };
        }
        const hidden = await hiddenGroupIds(req.currentUser);
        if (hidden.length) filter.group = { $nin: hidden };
        const events = await Event.find(filter).populate("host", "username displayName avatar").sort({ startsAt: 1 }).limit(100);
        res.json({ events, total: events.length });
      } catch (err) {
        next(err);
      }
    }
    async function create(req, res, next) {
      try {
        const { title, description, type, raceType, city, address, startsAt, group, maxAttendees, coverImage, circuit, laps } = req.body;
        const coordinates = coordinatesOf(city);
        if (!coordinates) return res.status(400).json({ error: "Pick a city from the list." });
        if (group) {
          const target = await Group.findById(group);
          if (!target) return res.status(404).json({ error: "Group not found." });
          const isMember = target.members.some((m) => m.equals(req.currentUser._id));
          const isManager = target.admin.equals(req.currentUser._id);
          if (!isMember && !isManager) {
            return res.status(403).json({ error: "Join the group before hosting an event for it." });
          }
        }
        const event = await Event.create({
          title,
          description,
          type,
          raceType: type === "race" ? raceType || "" : "",
          circuit: type === "race" ? circuit || "" : "",
          laps: type === "race" ? Number(laps) || 1 : 1,
          host: req.currentUser._id,
          group: group || null,
          city,
          address,
          startsAt,
          location: { type: "Point", coordinates },
          maxAttendees: maxAttendees || 0,
          coverImage: coverImage || void 0,
          attendees: [req.currentUser._id]
          // the host is going, obviously
        });
        await event.populate("host", "username displayName avatar");
        res.status(201).json({ ok: true, event });
      } catch (err) {
        next(err);
      }
    }
    async function update(req, res, next) {
      try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found." });
        if (!event.host.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "Only the host can edit this event." });
        }
        ["title", "description", "type", "raceType", "address", "startsAt", "maxAttendees", "coverImage", "circuit", "laps"].forEach((f) => {
          if (req.body[f] !== void 0) event[f] = req.body[f];
        });
        if (req.body.city !== void 0) {
          const coordinates = coordinatesOf(req.body.city);
          if (!coordinates) return res.status(400).json({ error: "Pick a city from the list." });
          event.city = req.body.city;
          event.location = { type: "Point", coordinates };
        }
        if (event.type !== "race") {
          event.raceType = "";
          event.circuit = "";
          event.laps = 1;
        }
        await event.save();
        await event.populate("host", "username displayName avatar");
        res.json({ ok: true, event });
      } catch (err) {
        next(err);
      }
    }
    async function remove(req, res, next) {
      try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found." });
        if (!event.host.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "Only the host can delete this event." });
        }
        await event.deleteOne();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function toggleAttend(req, res, next) {
      try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found." });
        if (event.host.equals(req.currentUser._id)) {
          return res.status(400).json({ error: "The host is always attending." });
        }
        const index = event.attendees.findIndex((a) => a.equals(req.currentUser._id));
        if (index === -1) {
          if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
            return res.status(409).json({ error: "This event is full." });
          }
          event.attendees.push(req.currentUser._id);
        } else {
          event.attendees.splice(index, 1);
        }
        await event.save();
        res.json({ ok: true, attending: index === -1, count: event.attendees.length });
      } catch (err) {
        next(err);
      }
    }
    async function toggleLike(req, res, next) {
      try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found." });
        const index = event.likes.findIndex((id) => id.equals(req.currentUser._id));
        if (index === -1) event.likes.push(req.currentUser._id);
        else event.likes.splice(index, 1);
        await event.save();
        res.json({ ok: true, likes: event.likes.length, liked: index === -1 });
      } catch (err) {
        next(err);
      }
    }
    async function addComment(req, res, next) {
      try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found." });
        event.comments.push({ author: req.currentUser._id, text: req.body.text });
        await event.save();
        await event.populate("comments.author", "username displayName avatar");
        res.status(201).json({ ok: true, comments: event.comments });
      } catch (err) {
        next(err);
      }
    }
    async function removeComment(req, res, next) {
      try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found." });
        const comment = event.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found." });
        const allowed = comment.author.equals(req.currentUser._id) || event.host.equals(req.currentUser._id) || req.currentUser.role === "admin";
        if (!allowed) return res.status(403).json({ error: "You cannot delete this comment." });
        comment.deleteOne();
        await event.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = {
      showEvents,
      showEvent,
      list,
      search,
      searchArea,
      create,
      update,
      remove,
      toggleAttend,
      toggleLike,
      addComment,
      removeComment
    };
  }
});

// src/routes/events.jsx
var require_events = __commonJS({
  "src/routes/events.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var events = require_eventController();
    var Event = require_Event();
    var { CITY_NAMES } = require_cities();
    var { CIRCUIT_IDS } = require_circuits();
    var { requireLogin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    var eventRules = [
      body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 3, max: 80 }).withMessage("Title must be 3-80 characters"),
      body("description").optional({ values: "falsy" }).isLength({ max: 1e3 }).withMessage("Description is too long"),
      body("type").isIn(Event.EVENT_TYPES).withMessage("Choose meet or race"),
      body("raceType").optional({ values: "falsy" }).isIn(Event.RACE_TYPES).withMessage("Unknown race type"),
      body("city").isIn(CITY_NAMES).withMessage("Pick a city from the list"),
      body("address").optional({ values: "falsy" }).isLength({ max: 120 }).withMessage("Address is too long"),
      body("startsAt").isISO8601().withMessage("Pick a valid date and time"),
      body("maxAttendees").optional({ values: "falsy" }).isInt({ min: 0, max: 1e4 }).withMessage("Attendee limit must be a sensible number"),
      body("circuit").optional({ values: "falsy" }).isIn(CIRCUIT_IDS).withMessage("Pick a circuit from the list"),
      body("laps").optional({ values: "falsy" }).isInt({ min: 1, max: 500 }).withMessage("Laps must be between 1 and 500")
    ];
    var commentRules = [
      body("text").trim().notEmpty().withMessage("Comment cannot be empty").isLength({ max: 500 }).withMessage("Comment is too long")
    ];
    router.use(requireLogin);
    router.get("/events", events.showEvents);
    router.get("/events/:id", validateObjectId(), events.showEvent);
    router.get("/api/events/search", events.search);
    router.post("/api/events/area", events.searchArea);
    router.get("/api/events", events.list);
    router.post("/api/events", eventRules, handleValidation, events.create);
    router.put("/api/events/:id", validateObjectId(), eventRules, handleValidation, events.update);
    router.delete("/api/events/:id", validateObjectId(), events.remove);
    router.post("/api/events/:id/attend", validateObjectId(), events.toggleAttend);
    router.post("/api/events/:id/like", validateObjectId(), events.toggleLike);
    router.post("/api/events/:id/comments", validateObjectId(), commentRules, handleValidation, events.addComment);
    router.delete("/api/events/:id/comments/:commentId", validateObjectId(), events.removeComment);
    module2.exports = router;
  }
});

// src/controllers/listingController.jsx
var require_listingController = __commonJS({
  "src/controllers/listingController.jsx"(exports2, module2) {
    var Listing = require_Listing();
    var { CITIES, coordinatesOf } = require_cities();
    var { contains, paginate, num } = require_query();
    function showMarket(req, res) {
      res.render("pages/market", {
        title: "Marketplace",
        cities: CITIES.map((c) => c.name),
        categories: Listing.CATEGORIES,
        conditions: Listing.CONDITIONS
      });
    }
    async function showListing(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id).populate("seller", "username displayName avatar location").populate("comments.author", "username displayName avatar");
        if (!listing) {
          return res.status(404).render("pages/error", {
            title: "Listing not found",
            message: "That item is no longer listed."
          });
        }
        res.render("pages/listing", {
          title: listing.title,
          listing,
          isSeller: listing.seller._id.equals(req.currentUser._id)
        });
      } catch (err) {
        next(err);
      }
    }
    async function list(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const filter = {};
        if (req.query.mine === "true") {
          filter.seller = req.currentUser._id;
        } else {
          if (req.query.includeSold !== "true") filter.status = "available";
        }
        if (req.query.seller) filter.seller = req.query.seller;
        const [listings, total] = await Promise.all([
          Listing.find(filter).populate("seller", "username displayName avatar").sort({ createdAt: -1 }).skip(skip).limit(limit),
          Listing.countDocuments(filter)
        ]);
        res.json({ listings, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function search(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const {
          keyword,
          category,
          condition,
          city,
          priceMin,
          priceMax,
          make,
          model,
          yearFrom,
          yearTo,
          includeSold
        } = req.query;
        const filter = {};
        if (keyword && keyword.trim()) {
          filter.$or = [{ title: contains(keyword) }, { description: contains(keyword) }];
        }
        if (category && Listing.CATEGORIES.includes(category)) filter.category = category;
        if (condition && Listing.CONDITIONS.includes(condition)) filter.condition = condition;
        if (city && coordinatesOf(city)) filter.city = city;
        if (make && make.trim()) filter.make = contains(make);
        if (model && model.trim()) filter.model = contains(model);
        if (includeSold !== "true") filter.status = "available";
        const pMin = num(priceMin);
        const pMax = num(priceMax);
        if (pMin !== null || pMax !== null) {
          filter.price = {};
          if (pMin !== null) filter.price.$gte = pMin;
          if (pMax !== null) filter.price.$lte = pMax;
        }
        const yFrom = num(yearFrom);
        const yTo = num(yearTo);
        if (yFrom !== null || yTo !== null) {
          filter.year = {};
          if (yFrom !== null) filter.year.$gte = yFrom;
          if (yTo !== null) filter.year.$lte = yTo;
        }
        let sort = { createdAt: -1 };
        if (req.query.sort === "price-asc") sort = { price: 1 };
        if (req.query.sort === "price-desc") sort = { price: -1 };
        const [listings, total] = await Promise.all([
          Listing.find(filter).populate("seller", "username displayName avatar").sort(sort).skip(skip).limit(limit),
          Listing.countDocuments(filter)
        ]);
        res.json({ listings, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
      } catch (err) {
        next(err);
      }
    }
    async function searchArea(req, res, next) {
      try {
        const { polygon, category, priceMax } = req.body;
        if (!Array.isArray(polygon) || polygon.length < 3) {
          return res.status(400).json({ error: "Draw an area with at least three points." });
        }
        const clean = polygon.map((p) => {
          if (!Array.isArray(p) || p.length !== 2) {
            throw Object.assign(new Error("Bad point"), { status: 400, expose: true });
          }
          const lng = Number(p[0]);
          const lat = Number(p[1]);
          if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            throw Object.assign(new Error("Point is outside the world"), { status: 400, expose: true });
          }
          return [lng, lat];
        });
        const first = clean[0];
        const last = clean[clean.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) clean.push([first[0], first[1]]);
        const filter = {
          status: "available",
          location: { $geoWithin: { $geometry: { type: "Polygon", coordinates: [clean] } } }
        };
        if (category && Listing.CATEGORIES.includes(category)) filter.category = category;
        const pMax = num(priceMax);
        if (pMax !== null) filter.price = { $lte: pMax };
        const listings = await Listing.find(filter).populate("seller", "username displayName avatar").sort({ createdAt: -1 }).limit(100);
        res.json({ listings, total: listings.length });
      } catch (err) {
        next(err);
      }
    }
    async function create(req, res, next) {
      try {
        const { title, description, price, category, condition, city, make, model, year, photos } = req.body;
        const coordinates = coordinatesOf(city);
        if (!coordinates) return res.status(400).json({ error: "Pick a city from the list." });
        const listing = await Listing.create({
          seller: req.currentUser._id,
          title,
          description,
          price,
          category,
          condition,
          city,
          location: { type: "Point", coordinates },
          make: make || "",
          model: model || "",
          year: year || null,
          photos: Array.isArray(photos) ? photos.slice(0, 6) : []
        });
        await listing.populate("seller", "username displayName avatar");
        res.status(201).json({ ok: true, listing });
      } catch (err) {
        next(err);
      }
    }
    async function update(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        if (!listing.seller.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "You can only edit your own listings." });
        }
        ["title", "description", "price", "category", "condition", "make", "model", "year", "status"].forEach((f) => {
          if (req.body[f] !== void 0) listing[f] = req.body[f];
        });
        if (req.body.city !== void 0) {
          const coordinates = coordinatesOf(req.body.city);
          if (!coordinates) return res.status(400).json({ error: "Pick a city from the list." });
          listing.city = req.body.city;
          listing.location = { type: "Point", coordinates };
        }
        if (Array.isArray(req.body.photos)) listing.photos = req.body.photos.slice(0, 6);
        await listing.save();
        await listing.populate("seller", "username displayName avatar");
        res.json({ ok: true, listing });
      } catch (err) {
        next(err);
      }
    }
    async function remove(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        if (!listing.seller.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "You can only delete your own listings." });
        }
        await listing.deleteOne();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    async function toggleSold(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        if (!listing.seller.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "Only the seller can change this." });
        }
        listing.status = listing.status === "sold" ? "available" : "sold";
        await listing.save();
        res.json({ ok: true, status: listing.status });
      } catch (err) {
        next(err);
      }
    }
    async function toggleLike(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        const index = listing.likes.findIndex((id) => id.equals(req.currentUser._id));
        if (index === -1) listing.likes.push(req.currentUser._id);
        else listing.likes.splice(index, 1);
        await listing.save();
        res.json({ ok: true, likes: listing.likes.length, liked: index === -1 });
      } catch (err) {
        next(err);
      }
    }
    async function addComment(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        listing.comments.push({ author: req.currentUser._id, text: req.body.text });
        await listing.save();
        await listing.populate("comments.author", "username displayName avatar");
        res.status(201).json({ ok: true, comments: listing.comments });
      } catch (err) {
        next(err);
      }
    }
    async function removeComment(req, res, next) {
      try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        const comment = listing.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found." });
        const allowed = comment.author.equals(req.currentUser._id) || listing.seller.equals(req.currentUser._id) || req.currentUser.role === "admin";
        if (!allowed) return res.status(403).json({ error: "You cannot delete this comment." });
        comment.deleteOne();
        await listing.save();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = {
      showMarket,
      showListing,
      list,
      search,
      searchArea,
      create,
      update,
      remove,
      toggleSold,
      toggleLike,
      addComment,
      removeComment
    };
  }
});

// src/routes/listings.jsx
var require_listings = __commonJS({
  "src/routes/listings.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var listings = require_listingController();
    var Listing = require_Listing();
    var { CITY_NAMES } = require_cities();
    var { requireLogin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    var listingRules = [
      body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 3, max: 80 }).withMessage("Title must be 3-80 characters"),
      body("description").optional({ values: "falsy" }).isLength({ max: 1e3 }).withMessage("Description is too long"),
      body("price").isFloat({ min: 0, max: 1e7 }).withMessage("Price must be a real amount"),
      body("category").isIn(Listing.CATEGORIES).withMessage("Pick a category"),
      body("condition").optional({ values: "falsy" }).isIn(Listing.CONDITIONS).withMessage("Unknown condition"),
      body("city").isIn(CITY_NAMES).withMessage("Pick a city from the list"),
      body("year").optional({ values: "falsy" }).isInt({ min: 1900, max: (/* @__PURE__ */ new Date()).getFullYear() + 1 }).withMessage("Year must be a real year"),
      body("make").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("Make is too long"),
      body("model").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("Model is too long")
    ];
    var commentRules = [
      body("text").trim().notEmpty().withMessage("Comment cannot be empty").isLength({ max: 500 }).withMessage("Comment is too long")
    ];
    router.use(requireLogin);
    router.get("/market", listings.showMarket);
    router.get("/market/:id", validateObjectId(), listings.showListing);
    router.get("/api/listings/search", listings.search);
    router.post("/api/listings/area", listings.searchArea);
    router.get("/api/listings", listings.list);
    router.post("/api/listings", listingRules, handleValidation, listings.create);
    router.put("/api/listings/:id", validateObjectId(), listingRules, handleValidation, listings.update);
    router.delete("/api/listings/:id", validateObjectId(), listings.remove);
    router.post("/api/listings/:id/sold", validateObjectId(), listings.toggleSold);
    router.post("/api/listings/:id/like", validateObjectId(), listings.toggleLike);
    router.post("/api/listings/:id/comments", validateObjectId(), commentRules, handleValidation, listings.addComment);
    router.delete("/api/listings/:id/comments/:commentId", validateObjectId(), listings.removeComment);
    module2.exports = router;
  }
});

// src/controllers/carController.jsx
var require_carController = __commonJS({
  "src/controllers/carController.jsx"(exports2, module2) {
    var Car = require_Car();
    var { contains, paginate, num } = require_query();
    function showGarage(req, res) {
      res.render("pages/garage", { title: "Garage", categories: Car.CATEGORIES });
    }
    async function list(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const filter = {};
        if (req.query.mine === "true") {
          filter.owner = req.currentUser._id;
        } else if (req.query.owner) {
          filter.owner = req.query.owner;
        }
        const [cars, total] = await Promise.all([
          Car.find(filter).populate("owner", "username displayName avatar").sort({ createdAt: -1 }).skip(skip).limit(limit),
          Car.countDocuments(filter)
        ]);
        res.json({ cars, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function search(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const { make, model, category, color, yearFrom, yearTo, hpMin, hpMax } = req.query;
        const filter = {};
        if (make && make.trim()) filter.make = contains(make);
        if (model && model.trim()) filter.model = contains(model);
        if (color && color.trim()) filter.color = contains(color);
        if (category && Car.CATEGORIES.includes(category)) filter.category = category;
        const yFrom = num(yearFrom);
        const yTo = num(yearTo);
        if (yFrom !== null || yTo !== null) {
          filter.year = {};
          if (yFrom !== null) filter.year.$gte = yFrom;
          if (yTo !== null) filter.year.$lte = yTo;
        }
        const hFrom = num(hpMin);
        const hTo = num(hpMax);
        if (hFrom !== null || hTo !== null) {
          filter.horsepower = {};
          if (hFrom !== null) filter.horsepower.$gte = hFrom;
          if (hTo !== null) filter.horsepower.$lte = hTo;
        }
        const [cars, total] = await Promise.all([
          Car.find(filter).populate("owner", "username displayName avatar").sort({ year: -1, createdAt: -1 }).skip(skip).limit(limit),
          Car.countDocuments(filter)
        ]);
        res.json({ cars, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
      } catch (err) {
        next(err);
      }
    }
    async function getOne(req, res, next) {
      try {
        const car = await Car.findById(req.params.id).populate("owner", "username displayName avatar");
        if (!car) return res.status(404).json({ error: "Car not found." });
        res.json({ car });
      } catch (err) {
        next(err);
      }
    }
    async function create(req, res, next) {
      try {
        const { make, model, year, category, engine, horsepower, color, description, photo } = req.body;
        const car = await Car.create({
          owner: req.currentUser._id,
          make,
          model,
          year,
          category,
          engine,
          horsepower,
          color,
          description,
          photo: photo || void 0
        });
        await car.populate("owner", "username displayName avatar");
        res.status(201).json({ ok: true, car });
      } catch (err) {
        next(err);
      }
    }
    async function update(req, res, next) {
      try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ error: "Car not found." });
        if (!car.owner.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "You can only edit cars in your own garage." });
        }
        const allowed = ["make", "model", "year", "category", "engine", "horsepower", "color", "description", "photo"];
        allowed.forEach((field) => {
          if (req.body[field] !== void 0) car[field] = req.body[field];
        });
        await car.save();
        await car.populate("owner", "username displayName avatar");
        res.json({ ok: true, car });
      } catch (err) {
        next(err);
      }
    }
    async function remove(req, res, next) {
      try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ error: "Car not found." });
        if (!car.owner.equals(req.currentUser._id) && req.currentUser.role !== "admin") {
          return res.status(403).json({ error: "You can only delete cars from your own garage." });
        }
        await car.deleteOne();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = { showGarage, list, search, getOne, create, update, remove };
  }
});

// src/routes/cars.jsx
var require_cars = __commonJS({
  "src/routes/cars.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var cars = require_carController();
    var Car = require_Car();
    var { requireLogin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    var carRules = [
      body("make").trim().notEmpty().withMessage("Make is required").isLength({ max: 40 }).withMessage("Make is too long"),
      body("model").trim().notEmpty().withMessage("Model is required").isLength({ max: 40 }).withMessage("Model is too long"),
      body("year").isInt({ min: 1900, max: (/* @__PURE__ */ new Date()).getFullYear() + 1 }).withMessage("Year must be a real year"),
      body("horsepower").optional({ values: "falsy" }).isInt({ min: 0, max: 2e3 }).withMessage("Horsepower must be between 0 and 2000"),
      body("category").optional({ values: "falsy" }).isIn(Car.CATEGORIES).withMessage("Unknown body type"),
      body("color").optional({ values: "falsy" }).isLength({ max: 30 }).withMessage("Color is too long"),
      body("engine").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("Engine text is too long"),
      body("description").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("Description is too long")
    ];
    router.use(requireLogin);
    router.get("/garage", cars.showGarage);
    router.get("/api/cars/search", cars.search);
    router.get("/api/cars", cars.list);
    router.get("/api/cars/:id", validateObjectId(), cars.getOne);
    router.post("/api/cars", carRules, handleValidation, cars.create);
    router.put("/api/cars/:id", validateObjectId(), carRules, handleValidation, cars.update);
    router.delete("/api/cars/:id", validateObjectId(), cars.remove);
    module2.exports = router;
  }
});

// src/models/Message.jsx
var require_Message = __commonJS({
  "src/models/Message.jsx"(exports2, module2) {
    var mongoose = require("mongoose");
    var messageSchema = new mongoose.Schema(
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    module2.exports = mongoose.model("Message", messageSchema);
  }
});

// src/controllers/messageController.jsx
var require_messageController = __commonJS({
  "src/controllers/messageController.jsx"(exports2, module2) {
    var Message = require_Message();
    var User = require_User();
    var { contains, paginate } = require_query();
    async function showChat(req, res, next) {
      try {
        const me = await User.findById(req.currentUser._id).populate("friends", "username displayName avatar");
        res.render("pages/chat", {
          title: "Chat",
          friends: me.friends,
          openWith: req.query.to || ""
        });
      } catch (err) {
        next(err);
      }
    }
    async function conversations(req, res, next) {
      try {
        const meId = req.currentUser._id;
        const messages = await Message.find({ $or: [{ from: meId }, { to: meId }] }).sort({ createdAt: -1 }).populate("from", "username displayName avatar").populate("to", "username displayName avatar").limit(300);
        const byPerson = /* @__PURE__ */ new Map();
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
    async function history(req, res, next) {
      try {
        const meId = req.currentUser._id;
        const other = req.params.userId;
        const { page, limit, skip } = paginate(req.query, 50, 200);
        const filter = {
          $or: [
            { from: meId, to: other },
            { from: other, to: meId }
          ]
        };
        const [messages, total] = await Promise.all([
          Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).populate("from", "username displayName avatar"),
          Message.countDocuments(filter)
        ]);
        res.json({ messages, total, page });
      } catch (err) {
        next(err);
      }
    }
    async function search(req, res, next) {
      try {
        const meId = req.currentUser._id;
        const { page, limit, skip } = paginate(req.query);
        const { keyword, withUser, dateFrom, dateTo, unreadOnly } = req.query;
        const filter = { $or: [{ from: meId }, { to: meId }] };
        const and = [];
        if (keyword && keyword.trim()) and.push({ text: contains(keyword) });
        if (withUser) and.push({ $or: [{ from: withUser }, { to: withUser }] });
        if (unreadOnly === "true") and.push({ read: false, to: meId });
        if (dateFrom || dateTo) {
          const range = {};
          const from = dateFrom ? new Date(dateFrom) : null;
          const to = dateTo ? new Date(dateTo) : null;
          if (from && !Number.isNaN(from.getTime())) range.$gte = from;
          if (to && !Number.isNaN(to.getTime())) {
            range.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1e3 - 1);
          }
          if (Object.keys(range).length) and.push({ createdAt: range });
        }
        if (and.length) filter.$and = and;
        const [messages, total] = await Promise.all([
          Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("from", "username displayName avatar").populate("to", "username displayName avatar"),
          Message.countDocuments(filter)
        ]);
        res.json({ messages, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function update(req, res, next) {
      try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ error: "Message not found." });
        if (!message.from.equals(req.currentUser._id)) {
          return res.status(403).json({ error: "You can only edit your own messages." });
        }
        message.text = req.body.text;
        await message.save();
        res.json({ ok: true, message });
      } catch (err) {
        next(err);
      }
    }
    async function remove(req, res, next) {
      try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ error: "Message not found." });
        if (!message.from.equals(req.currentUser._id)) {
          return res.status(403).json({ error: "You can only delete your own messages." });
        }
        await message.deleteOne();
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = { showChat, conversations, history, search, update, remove };
  }
});

// src/routes/messages.jsx
var require_messages = __commonJS({
  "src/routes/messages.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var messages = require_messageController();
    var { requireLogin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    var textRule = [
      body("text").trim().notEmpty().withMessage("Message cannot be empty").isLength({ max: 1e3 }).withMessage("Message is too long")
    ];
    router.use(requireLogin);
    router.get("/chat", messages.showChat);
    router.get("/api/messages/conversations", messages.conversations);
    router.get("/api/messages/search", messages.search);
    router.get("/api/messages/:userId", validateObjectId("userId"), messages.history);
    router.put("/api/messages/:id", validateObjectId(), textRule, handleValidation, messages.update);
    router.delete("/api/messages/:id", validateObjectId(), messages.remove);
    module2.exports = router;
  }
});

// src/controllers/statsController.jsx
var require_statsController = __commonJS({
  "src/controllers/statsController.jsx"(exports2, module2) {
    var Event = require_Event();
    var Listing = require_Listing();
    var Car = require_Car();
    var Group = require_Group();
    var User = require_User();
    var Message = require_Message();
    function showStats(req, res) {
      res.render("pages/stats", { title: "Statistics" });
    }
    async function summary(req, res, next) {
      try {
        const [members, groups, events, listings, cars, messages] = await Promise.all([
          User.countDocuments(),
          Group.countDocuments(),
          Event.countDocuments(),
          Listing.countDocuments(),
          Car.countDocuments(),
          Message.countDocuments()
        ]);
        res.json({ members, groups, events, listings, cars, messages });
      } catch (err) {
        next(err);
      }
    }
    async function eventsPerMonth(req, res, next) {
      try {
        const rows = await Event.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$startsAt" },
                month: { $month: "$startsAt" },
                type: "$type"
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);
        const byMonth = /* @__PURE__ */ new Map();
        rows.forEach((row) => {
          const key = row._id.year + "-" + String(row._id.month).padStart(2, "0");
          if (!byMonth.has(key)) byMonth.set(key, { month: key, meet: 0, race: 0 });
          byMonth.get(key)[row._id.type] = row.count;
        });
        const data = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
        res.json({ data });
      } catch (err) {
        next(err);
      }
    }
    async function carsByMake(req, res, next) {
      try {
        const data = await Car.aggregate([
          {
            $group: {
              // upper case the make first, otherwise "bmw" and "BMW" get counted separately
              _id: { $toUpper: "$make" },
              count: { $sum: 1 },
              averageHorsepower: { $avg: "$horsepower" }
            }
          },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              make: "$_id",
              count: 1,
              averageHorsepower: { $round: [{ $ifNull: ["$averageHorsepower", 0] }, 0] }
            }
          }
        ]);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    }
    async function listingsByCategory(req, res, next) {
      try {
        const data = await Listing.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              averagePrice: { $avg: "$price" }
            }
          },
          { $sort: { count: -1 } },
          {
            $project: {
              _id: 0,
              category: "$_id",
              count: 1,
              averagePrice: { $round: [{ $ifNull: ["$averagePrice", 0] }, 0] }
            }
          }
        ]);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    }
    async function eventsByCity(req, res, next) {
      try {
        const data = await Event.aggregate([
          {
            $group: {
              _id: "$city",
              count: { $sum: 1 },
              attendees: { $sum: { $size: "$attendees" } }
            }
          },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 12 },
          { $project: { _id: 0, city: "$_id", count: 1, attendees: 1 } }
        ]);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    }
    async function groupActivity(req, res, next) {
      try {
        const data = await Group.aggregate([
          {
            $lookup: {
              from: "events",
              localField: "_id",
              foreignField: "group",
              as: "events"
            }
          },
          {
            $project: {
              _id: 0,
              name: 1,
              members: { $size: "$members" },
              events: { $size: "$events" },
              // how many months the group has existed. never less than 1 or I divide by zero
              monthsActive: {
                $max: [
                  1,
                  {
                    $ceil: {
                      $divide: [{ $subtract: [/* @__PURE__ */ new Date(), "$createdAt"] }, 1e3 * 60 * 60 * 24 * 30]
                    }
                  }
                ]
              }
            }
          },
          {
            $addFields: {
              eventsPerMonth: { $round: [{ $divide: ["$events", "$monthsActive"] }, 2] }
            }
          },
          { $sort: { members: -1 } },
          { $limit: 10 }
        ]);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = {
      showStats,
      summary,
      eventsPerMonth,
      carsByMake,
      listingsByCategory,
      eventsByCity,
      groupActivity
    };
  }
});

// src/routes/stats.jsx
var require_stats = __commonJS({
  "src/routes/stats.jsx"(exports2, module2) {
    var express2 = require("express");
    var stats = require_statsController();
    var { requireLogin } = require_auth();
    var router = express2.Router();
    router.use(requireLogin);
    router.get("/stats", stats.showStats);
    router.get("/api/stats/summary", stats.summary);
    router.get("/api/stats/events-per-month", stats.eventsPerMonth);
    router.get("/api/stats/cars-by-make", stats.carsByMake);
    router.get("/api/stats/listings-by-category", stats.listingsByCategory);
    router.get("/api/stats/events-by-city", stats.eventsByCity);
    router.get("/api/stats/group-activity", stats.groupActivity);
    module2.exports = router;
  }
});

// src/controllers/adminController.jsx
var require_adminController = __commonJS({
  "src/controllers/adminController.jsx"(exports2, module2) {
    var User = require_User();
    var Group = require_Group();
    var Event = require_Event();
    var Listing = require_Listing();
    var Car = require_Car();
    var Message = require_Message();
    var { contains, paginate } = require_query();
    function showAdmin(req, res) {
      res.render("pages/admin", { title: "Administration" });
    }
    async function overview(req, res, next) {
      try {
        const [members2, groups, events, listings, cars, messages, recentMembers] = await Promise.all([
          User.countDocuments(),
          Group.countDocuments(),
          Event.countDocuments(),
          Listing.countDocuments(),
          Car.countDocuments(),
          Message.countDocuments(),
          User.find().select("username displayName avatar location role createdAt").sort({ createdAt: -1 }).limit(10)
        ]);
        res.json({
          counts: { members: members2, groups, events, listings, cars, messages },
          recentMembers
        });
      } catch (err) {
        next(err);
      }
    }
    async function members(req, res, next) {
      try {
        const { page, limit, skip } = paginate(req.query);
        const { username, location, role } = req.query;
        const filter = {};
        if (username && username.trim()) {
          filter.$or = [{ username: contains(username) }, { displayName: contains(username) }];
        }
        if (location && location.trim()) filter.location = contains(location);
        if (role === "admin" || role === "user") filter.role = role;
        const [users, total] = await Promise.all([
          User.find(filter).select("username displayName avatar location role friends createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
          User.countDocuments(filter)
        ]);
        res.json({ users, total, page, pages: Math.ceil(total / limit) || 1 });
      } catch (err) {
        next(err);
      }
    }
    async function setRole(req, res, next) {
      try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
          return res.status(400).json({ error: 'Role must be "user" or "admin".' });
        }
        if (String(req.params.id) === String(req.currentUser._id) && role !== "admin") {
          return res.status(400).json({ error: "You cannot remove your own administrator rights." });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Member not found." });
        user.role = role;
        await user.save();
        res.json({ ok: true, role: user.role });
      } catch (err) {
        next(err);
      }
    }
    async function content(req, res, next) {
      try {
        const [events, listings] = await Promise.all([
          Event.find().populate("host", "username displayName").sort({ createdAt: -1 }).limit(15),
          Listing.find().populate("seller", "username displayName").sort({ createdAt: -1 }).limit(15)
        ]);
        res.json({ events, listings });
      } catch (err) {
        next(err);
      }
    }
    module2.exports = { showAdmin, overview, members, setRole, content };
  }
});

// src/routes/admin.jsx
var require_admin = __commonJS({
  "src/routes/admin.jsx"(exports2, module2) {
    var express2 = require("express");
    var { body } = require("express-validator");
    var admin = require_adminController();
    var { requireLogin, requireAdmin } = require_auth();
    var { handleValidation, validateObjectId } = require_validate();
    var router = express2.Router();
    router.use(requireLogin, requireAdmin);
    router.get("/admin", admin.showAdmin);
    router.get("/api/admin/overview", admin.overview);
    router.get("/api/admin/members", admin.members);
    router.get("/api/admin/content", admin.content);
    router.post(
      "/api/admin/members/:id/role",
      validateObjectId(),
      [body("role").isIn(["user", "admin"]).withMessage('Role must be "user" or "admin"')],
      handleValidation,
      admin.setRole
    );
    module2.exports = router;
  }
});

// src/middleware/upload.jsx
var require_upload = __commonJS({
  "src/middleware/upload.jsx"(exports2, module2) {
    var path2 = require("path");
    var crypto = require("crypto");
    var multer = require("multer");
    var { UPLOADS, VIDEO } = require_paths();
    var storage = multer.diskStorage({
      destination(req, file, cb) {
        cb(null, UPLOADS);
      },
      filename(req, file, cb) {
        const ext = path2.extname(file.originalname).toLowerCase();
        const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) ? ext : ".jpg";
        cb(null, crypto.randomBytes(16).toString("hex") + safeExt);
      }
    });
    var ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    var ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/ogg"];
    function filterBy(list, message) {
      return function fileFilter(req, file, cb) {
        if (list.includes(file.mimetype)) return cb(null, true);
        cb(Object.assign(new Error(message), { status: 400, expose: true }));
      };
    }
    var upload = multer({
      storage,
      fileFilter: filterBy(ALLOWED_IMAGES, "Only JPG, PNG, GIF and WebP images are allowed."),
      limits: { fileSize: 2 * 1024 * 1024, files: 6 }
      // 2MB per file, 6 files max
    });
    var uploadVideo = multer({
      storage: multer.diskStorage({
        destination(req, file, cb) {
          cb(null, VIDEO);
        },
        filename(req, file, cb) {
          const ext = path2.extname(file.originalname).toLowerCase();
          const safeExt = [".mp4", ".webm", ".ogv"].includes(ext) ? ext : ".mp4";
          cb(null, crypto.randomBytes(16).toString("hex") + safeExt);
        }
      }),
      fileFilter: filterBy(ALLOWED_VIDEOS, "Only MP4, WebM and Ogg video files are allowed."),
      limits: { fileSize: 25 * 1024 * 1024, files: 1 }
      // 25MB, one at a time
    });
    module2.exports = upload;
    module2.exports.video = uploadVideo;
  }
});

// src/routes/uploads.jsx
var require_uploads = __commonJS({
  "src/routes/uploads.jsx"(exports2, module2) {
    var fs = require("fs").promises;
    var path2 = require("path");
    var express2 = require("express");
    var { VIDEO } = require_paths();
    var upload = require_upload();
    var { requireLogin } = require_auth();
    var router = express2.Router();
    var CLIPS_FILE = path2.join(VIDEO, "clips.json");
    router.use(requireLogin);
    router.post("/api/upload", upload.single("image"), (req, res) => {
      if (!req.file) return res.status(400).json({ error: "No image was uploaded." });
      res.status(201).json({ ok: true, url: "/uploads/" + req.file.filename });
    });
    router.post("/api/upload/many", upload.array("images", 6), (req, res) => {
      if (!req.files || !req.files.length) {
        return res.status(400).json({ error: "No images were uploaded." });
      }
      res.status(201).json({ ok: true, urls: req.files.map((f) => "/uploads/" + f.filename) });
    });
    router.post("/api/upload/video", upload.video.single("video"), async (req, res, next) => {
      try {
        if (!req.file) return res.status(400).json({ error: "No video was uploaded." });
        const url = "/video/" + req.file.filename;
        const title = (req.body.title || "Recap clip").toString().slice(0, 80);
        let clips = [];
        try {
          clips = JSON.parse(await fs.readFile(CLIPS_FILE, "utf8"));
          if (!Array.isArray(clips)) clips = [];
        } catch (err) {
          clips = [];
        }
        clips.push({ title, src: url });
        await fs.writeFile(CLIPS_FILE, JSON.stringify(clips, null, 2));
        res.status(201).json({ ok: true, url, clips });
      } catch (err) {
        next(err);
      }
    });
    module2.exports = router;
  }
});

// src/socket/chat.jsx
var require_chat = __commonJS({
  "src/socket/chat.jsx"(exports2, module2) {
    var { Server } = require("socket.io");
    var Message = require_Message();
    var User = require_User();
    function attachChat(server2, sessionMiddleware2) {
      const io = new Server(server2);
      io.engine.use(sessionMiddleware2);
      io.use(async (socket, next) => {
        const session2 = socket.request.session;
        if (!session2 || !session2.userId) {
          return next(new Error("You must be logged in to chat."));
        }
        try {
          const user = await User.findById(session2.userId).select("username displayName avatar");
          if (!user) return next(new Error("Your account no longer exists."));
          socket.user = user;
          next();
        } catch (err) {
          next(err);
        }
      });
      io.on("connection", (socket) => {
        const me = socket.user;
        socket.join(String(me._id));
        socket.broadcast.emit("presence", { userId: String(me._id), online: true });
        socket.on("history:load", async ({ withUserId }, ack) => {
          try {
            if (!withUserId) return ack && ack({ error: "Choose somebody to talk to." });
            const messages = await Message.find({
              $or: [
                { from: me._id, to: withUserId },
                { from: withUserId, to: me._id }
              ]
            }).sort({ createdAt: 1 }).limit(200).populate("from", "username displayName avatar");
            await Message.updateMany({ from: withUserId, to: me._id, read: false }, { read: true });
            ack && ack({ messages });
          } catch (err) {
            console.error("[chat] history:load", err.message);
            ack && ack({ error: "Could not load that conversation." });
          }
        });
        socket.on("message:send", async ({ to, text }, ack) => {
          try {
            const clean = typeof text === "string" ? text.trim() : "";
            if (!clean) return ack && ack({ error: "Write something first." });
            if (clean.length > 1e3) return ack && ack({ error: "Message is too long." });
            if (!to) return ack && ack({ error: "No recipient." });
            if (String(to) === String(me._id)) {
              return ack && ack({ error: "You cannot message yourself." });
            }
            const recipient = await User.findById(to).select("_id");
            if (!recipient) return ack && ack({ error: "That member does not exist." });
            const message = await Message.create({ from: me._id, to, text: clean });
            await message.populate("from", "username displayName avatar");
            io.to(String(to)).emit("message:new", message);
            io.to(String(me._id)).emit("message:new", message);
            ack && ack({ ok: true, message });
          } catch (err) {
            console.error("[chat] message:send", err.message);
            ack && ack({ error: "Could not send that message." });
          }
        });
        socket.on("typing", ({ to, typing }) => {
          if (!to) return;
          io.to(String(to)).emit("typing", {
            userId: String(me._id),
            typing: Boolean(typing)
          });
        });
        socket.on("disconnect", () => {
          socket.broadcast.emit("presence", { userId: String(me._id), online: false });
        });
      });
      return io;
    }
    module2.exports = attachChat;
  }
});

// src/utils/defaultPhotos.jsx
var require_defaultPhotos = __commonJS({
  "src/utils/defaultPhotos.jsx"(exports2, module2) {
    var Event = require_Event();
    var Group = require_Group();
    var EVENT_DEFAULT = "/img/default-event.svg";
    var GROUP_DEFAULT = "/img/default-cover.svg";
    var EVENT_BY_TITLE = {
      "Friday night cruise": "friday-night-cruise",
      "Haifa port meet": "car-meet",
      "Cars and coffee": "car-meet",
      "Classic breakfast run": "classic-meet",
      "Supercar breakfast meet": "car-meet",
      "Negev desert run": "negev-desert",
      "Negev scenic run": "sunday-drive",
      "Sunday canyon drive": "sunday-drive",
      "EV road trip north": "ev-charging",
      "Drag night": "drag-race",
      "Time attack round": "time-attack",
      "Drift practice": "drift-race",
      "Hill climb": "hill-climb",
      "Rally sprint": "rally-sprint"
    };
    var EVENT_BY_RACE_TYPE = {
      Drag: "drag-race",
      "Time attack": "time-attack",
      Drift: "drift-race",
      Hillclimb: "hill-climb",
      Rally: "rally-sprint"
    };
    var GROUP_BY_NAME = {
      "BMW Israel": "/img/cars/bmw-m3-cs-2023.jpg",
      "JDM Israel": "/img/cars/nissan-r34.jpg",
      "Negev Off-road": "/img/cars/defender-90.jpg",
      "Classic Cars IL": "/img/cars/vw-beetle.jpg",
      "EV Drivers IL": "/img/cars/tesla-model-3.jpg",
      "Drift Collective": "/img/events/drift-race.jpg",
      "Tuning Garage": "/img/cars/ford-focus-rs.jpg"
    };
    function eventPhoto(ev) {
      const name = EVENT_BY_TITLE[ev.title] || EVENT_BY_RACE_TYPE[ev.raceType] || (ev.type === "race" ? "track-day" : "car-meet");
      return "/img/events/" + name + ".jpg";
    }
    async function applyDefaultPhotos() {
      try {
        const events = await Event.find({ coverImage: { $in: [EVENT_DEFAULT, null, ""] } });
        for (const ev of events) {
          await Event.updateOne({ _id: ev._id }, { coverImage: eventPhoto(ev) });
        }
        const groups = await Group.find({
          coverImage: { $in: [GROUP_DEFAULT, null, ""] },
          name: { $in: Object.keys(GROUP_BY_NAME) }
        });
        for (const g of groups) {
          await Group.updateOne({ _id: g._id }, { coverImage: GROUP_BY_NAME[g.name] });
        }
        if (events.length || groups.length) {
          console.log(`[photos] gave covers to ${events.length} events and ${groups.length} groups`);
        }
      } catch (err) {
        console.error("[photos] could not apply default photos", err.message);
      }
    }
    module2.exports = applyDefaultPhotos;
  }
});

// server.jsx
require("dotenv").config();
var path = require("path");
var http = require("http");
var express = require("express");
var session = require("express-session");
var MongoStore = require("connect-mongo");
var morgan = require("morgan");
var compression = require("compression");
var connectDB = require_db();
var { VIEWS, PUBLIC } = require_paths();
var { attachUser } = require_auth();
var { notFound, errorHandler } = require_error();
var app = express();
var server = http.createServer(app);
app.set("view engine", "ejs");
app.set("views", VIEWS);
var inProduction = process.env.NODE_ENV === "production";
if (inProduction) app.set("trust proxy", 1);
app.use(compression());
app.get("/healthz", async (req, res) => {
  res.set("Cache-Control", "no-store").type("text");
  if (!req.query.db) return res.send("ok");
  try {
    await require("mongoose").connection.db.admin().ping();
    res.send("ok, database ok");
  } catch (err) {
    res.status(503).send("database not reachable");
  }
});
app.use(morgan(inProduction ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.locals.assetVersion = (process.env.RENDER_GIT_COMMIT || Date.now().toString(36)).slice(0, 8);
app.locals.reactProps = (data) => JSON.stringify(data === void 0 ? {} : data).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
app.use(express.static(PUBLIC, { maxAge: "7d" }));
var sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "maslul-dev-secret",
  resave: false,
  saveUninitialized: false,
  // touchAfter: only write the session back to the database once a day
  // instead of on every request, one less round trip per page
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, touchAfter: 24 * 60 * 60 }),
  cookie: {
    httpOnly: true,
    // not readable from JavaScript
    secure: inProduction,
    // only over https when hosted, plain http is fine locally
    maxAge: 1e3 * 60 * 60 * 24 * 7
    // one week
  }
});
app.use(sessionMiddleware);
app.use(attachUser);
app.use((req, res, next) => {
  const match = /(?:^|;\s*)lang=(he|en)\b/.exec(req.headers.cookie || "");
  res.locals.lang = match ? match[1] : "en";
  const theme = /(?:^|;\s*)theme=(light|dark)\b/.exec(req.headers.cookie || "");
  res.locals.theme = theme ? theme[1] : "";
  next();
});
app.use(require_routes());
app.use(require_auth2());
app.use(require_feed());
app.use(require_users());
app.use(require_groups());
app.use(require_events());
app.use(require_listings());
app.use(require_cars());
app.use(require_messages());
app.use(require_stats());
app.use(require_admin());
app.use(require_uploads());
require_chat()(server, sessionMiddleware);
app.use(notFound);
app.use(errorHandler);
var PORT = process.env.PORT || 3e3;
connectDB().then(async () => {
  await require_defaultPhotos()();
  server.listen(PORT, () => {
    console.log(`[server] Maslul running on http://localhost:${PORT}`);
  });
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
module.exports = { app, server, sessionMiddleware };
