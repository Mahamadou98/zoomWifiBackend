const mongoose = require('mongoose')

const ConnexionSchemas = new mongoose.Schema({
  location: {
    type: String,
    required: [true, 'la Localisation est requis'],
  },
  type: {
    type: String,
    required: [true, "l'adresse est requis"],
  },
  duration: {
    type: Number,
    required: [true, 'la duree de connexion est requis'],
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },

  // Reference to Partner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Must match the Partner model name
    required: true, // Ensure each access point is linked to a partner
  },
})

const Connexion = mongoose.model('Connexion', ConnexionSchemas)

module.exports = Connexion
