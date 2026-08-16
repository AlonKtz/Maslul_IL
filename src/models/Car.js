const mongoose = require('mongoose');

// Body types power part of the advanced garage search.
const CAR_CATEGORIES = ['Sedan', 'Hatchback', 'SUV', 'Coupe', 'Convertible', 'Pickup', 'Van', 'Other'];

/**
 * Car model — a vehicle in a user's virtual "garage".
 * This is the model behind the advanced multi-parameter search
 * (make + model + year range + horsepower range + color/category).
 */
const carSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
      maxlength: [40, 'Make is too long'],
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
      maxlength: [40, 'Model is too long'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1900, 'Year seems too old'],
      max: [new Date().getFullYear() + 1, 'Year is in the future'],
    },
    category: {
      type: String,
      enum: { values: CAR_CATEGORIES, message: '{VALUE} is not a valid body type' },
      default: 'Other',
    },
    engine: { type: String, trim: true, maxlength: [40, 'Engine text is too long'], default: '' },
    horsepower: {
      type: Number,
      min: [0, 'Horsepower cannot be negative'],
      max: [2000, 'Horsepower seems too high'],
      default: 0,
    },
    color: { type: String, trim: true, maxlength: [30, 'Color is too long'], default: '' },
    photo: { type: String, default: '/img/default-car.svg' },
    description: { type: String, maxlength: [500, 'Description is too long'], default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Car', carSchema);
module.exports.CATEGORIES = CAR_CATEGORIES;
