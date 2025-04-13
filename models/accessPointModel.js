const mongoose = require('mongoose')

const AccessPointSchemas = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'le nom est requis'],
  },
  location: {
    type: String,
    required: [true, 'la Localisation est requis'],
  },
  address: {
    type: String,
    required: [true, "l'adresse est requis"],
  },
  connectionType: {
    type: String,
    required: [true, 'type de connexion est requis'],
  },
  maxClients: {
    type: String,
    required: [true, 'nombre maximal des clients est requis.'],
  },
  bandwidth: {
    type: String,
    required: [true, 'la bande passante est requis.'],
  },
  autoRestart: {
    type: Boolean,
  },
  scheduleStart: {
    type: String,
  },
  scheduleEnd: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },

  // Reference to Partner
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner', // Must match the Partner model name
    required: true, // Ensure each access point is linked to a partner
  },
})

const AccessPoint = mongoose.model('AccessPoint', AccessPointSchemas)

module.exports = AccessPoint
