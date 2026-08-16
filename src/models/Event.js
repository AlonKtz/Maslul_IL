const mongoose = require('mongoose');
const commentSchema = require('./commentSchema');
const { CITY_NAMES } = require('../data/cities');

const EVENT_TYPES = ['meet', 'race'];
const RACE_TYPES = ['Drag', 'Track', 'Rally', 'Hillclimb', 'Drift', 'Time attack'];

/**
 * Event model — a car meet or a race.
 *
 * `location` is a GeoJSON point so MongoDB can answer "which events fall
 * inside the area the user drew on the map?" with a $geoWithin query.
 * It is filled in from the chosen city (see src/data/cities.js), so the
 * member never has to type coordinates.
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title is too short'],
      maxlength: [80, 'Title is too long'],
    },
    description: { type: String, maxlength: [1000, 'Description is too long'], default: '' },

    type: {
      type: String,
      enum: { values: EVENT_TYPES, message: '{VALUE} is not a valid event type' },
      required: [true, 'Event type is required'],
    },
    // Only meaningful when type === 'race'.
    raceType: {
      type: String,
      enum: { values: RACE_TYPES.concat(['']), message: '{VALUE} is not a valid race type' },
      default: '',
    },

    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

    startsAt: { type: Date, required: [true, 'Start date and time are required'] },

    city: {
      type: String,
      required: [true, 'City is required'],
      enum: { values: CITY_NAMES, message: '{VALUE} is not a city we know' },
    },
    address: { type: String, maxlength: [120, 'Address is too long'], default: '' },

    // GeoJSON point: [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v) => Array.isArray(v) && v.length === 2,
          message: 'Location must be a [longitude, latitude] pair',
        },
      },
    },

    coverImage: { type: String, default: '/img/default-event.svg' },
    maxAttendees: { type: Number, min: [0, 'Cannot be negative'], default: 0 }, // 0 = unlimited

    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Required for $geoWithin / $near queries on `location`.
eventSchema.index({ location: '2dsphere' });
// The event lists are almost always sorted by when the event happens.
eventSchema.index({ startsAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.RACE_TYPES = RACE_TYPES;
