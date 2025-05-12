const express = require('express')

const {
  createUserTransaction,
  getAllTransactions,
  updateStatus,
} = require('../controllers/transactionController')

const router = express.Router()

router.route('/rechargeUser').post(createUserTransaction)
router.route('/').get(getAllTransactions)
router.patch('/updateStatus/:id', updateStatus)

// updateStatus
// router.route('/:partnerId/acesspoints').get(getAllAccessPointsByPartner)

// router.route('/').get(getAllAccessPoint).post(createAccessPoint)
// router
//   .route('/:id')
//   .get(getAccessPoint)
//   .put(updateAccessPoint)
//   .delete(deleteAccessPoint)

module.exports = router
