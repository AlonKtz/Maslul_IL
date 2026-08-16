const mongoose = require('mongoose');
const commentSchema = require('./commentSchema');
const { CITY_NAMES } = require('../data/cities');

const LISTING_CATEGORIES = [
  'Whole car',
  'Engine & drivetrain',
  'Wheels & tires',
  'Body & exterior',
  'Interior',
  'Audio & electronics',
  'Tools',
  'Other parts',
];
const CONDITIONS = ['New', 'Like new', 'Used', 'For parts'];

/**
 * Listing model — an item for sale in the local marketplace.
 *
 * Like Event it carries a GeoJSON point (taken from the chosen city) so a
 * buyer can search for what is being sold inside an area of the map.
 */
const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title is too short'],
      maxlength: [80, 'Title is too long'],
    },
    description: { type: String, maxlength: [1000, 'Description is too long'], default: '' },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [10000000, 'Price is unrealistically high'],
    },

    category: {
      type: String,
      enum: { values: LISTING_CATEGORIES, message: '{VALUE} is not a valid category' },
      required: [true, 'Category is required'],
    },
    condition: {
      type: String,
      enum: { values: CONDITIONS, message: '{VALUE} is not a valid condition' },
      default: 'Used',
    },

    // Only filled in when selling a whole car.
    make: { type: String, trim: true, maxlength: [40, 'Make is too long'], default: '' },
    model: { type: String, trim: true, maxlength: [40, 'Model is too long'], default: '' },
    year: {
      type: Number,
      min: [1900, 'Year seems too old'],
      max: [new Date().getFullYear() + 1, 'Year is in the future'],
      default: null,
    },

    city: {
      type: String,
      required: [true, 'City is required'],
      enum: { values: CITY_NAMES, message: '{VALUE} is not a city we know' },
    },
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

    photos: [{ type: String }],
    status: {
      type: String,
      enum: { values: ['available', 'sold'], message: '{VALUE} is not a valid status' },
      default: 'available',
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

listingSchema.index({ location: '2dsphere' });
listingSchema.index({ price: 1 });

module.exports = mongoose.model('Listing', listingSchema);
module.exports.CATEGORIES = LISTING_CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
