const mongoose = require('mongoose')

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A city must have a name'],
    trim: true,
  },
  isCapital: {
    type: Boolean,
    default: false,
  },
})

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A country must have a name'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'A country must have a code'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Country code must be 2 or 3 characters long'],
    maxlength: [3, 'Country code must be 2 or 3 characters long'],
  },
  cities: [citySchema],
  currency: {
    type: String,
    required: [true, 'A country must have a currency'],
  },
  tarifFibrePerMinute: {
    type: Number,
    required: [true, 'A country must have a tarif fibre per minute'],
  },
  tarifDataPerMo: {
    type: Number,
    required: [true, 'A country must have a tarif data per Mo'],
  },
})

module.exports = mongoose.model('Country', countrySchema)
