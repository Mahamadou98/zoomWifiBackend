const mongoose = require('mongoose')

const ConnexionSchemas = new mongoose.Schema({
  clientId: {
    type: String,
    required: [true, "L'identification unique est requis"],
  },
  establishmentName: {
    type: String,
  },
  connectionDuration: {
    type: String,
    required: [true, 'this is required'],
  },
  cost: {
    type: String,
    required: [true, 'le cout est requis'],
  },
  connectionType: {
    type: String,
    required: [true, 'Type de connexion est requis.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  // Reference to Client
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User', // Must match the Partner model name
  //   required: true, // Ensure each access point is linked to a partner
  // },
})

const Connexion = mongoose.model('Connexion', ConnexionSchemas)

module.exports = Connexion
