const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const TransactionShemas = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topup', 'withdrowal', 'transfer'],
    required: [true, 'Le type est requis'],
  },
  balance: {
    type: Number,
    required: [true, 'le montant est requis'],
    validate: {
      validator: function (val) {
        return val > 0
      },
      message: 'le montant doit etre superieur a 0',
    },
  },
  commission: {
    type: Number,
    validate: {
      validator: function (val) {
        return val > 0
      },
      message: 'le montant doit etre superieur a 0',
    },
  },
  partnerShare: {
    type: Number,
    validate: {
      validator: function (val) {
        return val > 0
      },
      message: 'le montant doit etre superieur a 0',
    },
  },
  description: {
    type: String,
    required: [true, 'la description est requis'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  status: {
    type: String,
    enum: ['en attente', 'valide', 'rejete'],
    default: 'en attente',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
})

const Transaction = mongoose.model('Transaction', TransactionShemas)

module.exports = Transaction
