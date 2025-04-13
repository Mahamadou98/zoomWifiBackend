const express = require('express')

const {
  getAllConnexions,
  createConnexion,
  getConnexion,
  deleteConnexion,
} = require('./../controllers/connexionController')

const router = express.Router()

router.route('/').get(getAllConnexions).post(createConnexion)

router.route('/:id').get(getConnexion).delete(deleteConnexion)

module.exports = router
