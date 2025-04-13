const express = require('express')

const {
  getAllAccessPoint,
  createAccessPoint,
  getAccessPoint,
  updateAccessPoint,
  deleteAccessPoint,
  getAllAccessPointsByPartner,
} = require('./../controllers/accessPointController')

const router = express.Router()

// router.route('/:partnerId/acesspoints').get(getAllAccessPointsByPartner)

router.route('/').get(getAllAccessPoint).post(createAccessPoint)
router
  .route('/:id')
  .get(getAccessPoint)
  .put(updateAccessPoint)
  .delete(deleteAccessPoint)

module.exports = router
