const mongoose = require('mongoose')

const CompanySchemas = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'le nom est requis'],
  },
  contact: {
    type: String,
    required: [true, 'le contact est requis'],
  },
  city: {
    type: String,
    required: [true, 'la ville est requis'],
  },
  email: {
    type: String,
    required: [true, "l'address mail est requis"],
    unique: true,
    lowercase: true,
  },
  address: {
    type: String,
    required: [true, "l'adresse est requis"],
  },
  country: {
    type: String,
    required: [true, 'le pays est requis'],
  },
  balance: {
    type: Number,
    default: 0,
  },
  commissionPercent: {
    type: Number,
  },
  partnerCommissionPercent: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
})

const Company = mongoose.model('Company', CompanySchemas)

module.exports = Company
