const mongoose = require('mongoose');

// the body types a user can choose. the garage search filter uses this list too
const CAR_CATEGORIES = ['Sedan', 'Hatchback', 'SUV', 'Coupe', 'Convertible', 'Pickup', 'Van', 'Other'];

/*
  Car model.
  Every car belongs to one user and shows up in their garage.
  This is also the model behind the big search on the garage page, where you
  can filter by make, model, year range, horsepower range, colour and body type.
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
