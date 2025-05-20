const express = require('express')

const {
  createUserTransaction,
  getAllTransactions,
  updateStatus,
  adminRetrieveTransaction,
} = require('../controllers/transactionController')

const router = express.Router()

router.route('/adminRetrait').post(adminRetrieveTransaction)
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
