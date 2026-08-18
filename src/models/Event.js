const mongoose = require('mongoose');
const commentSchema = require('./commentSchema');
const { CITY_NAMES } = require('../data/cities');

const EVENT_TYPES = ['meet', 'race'];
const RACE_TYPES = ['Drag', 'Track', 'Rally', 'Hillclimb', 'Drift', 'Time attack'];

/*
  Event model. An event is either a car meet or a race.

  The location field is saved as a GeoJSON point. I need that so Mongo can run
  a $geoWithin query and tell me which events fall inside the shape the user
  draws on the map. The coordinates come from the city they pick
  (see src/data/cities.js) so nobody has to type in numbers.
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
    // this one only matters when the type is 'race'
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

    // GeoJSON point. the order is [longitude, latitude], not the other way round
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
    maxAttendees: { type: Number, min: [0, 'Cannot be negative'], default: 0 }, // 0 means no limit

    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// mongo needs this index before it will run the map area search
eventSchema.index({ location: '2dsphere' });
// nearly every event list is sorted by date, so index that as well
eventSchema.index({ startsAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.RACE_TYPES = RACE_TYPES;
