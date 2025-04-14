const express = require('express')
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  getAllPartners,
  getPartner,
  updatePartner,
  updateMe,
  deleteMe,
  getProfile,
  updatePartnerStatus,
  confirmEmail,
} = require('./../controllers/partnerController')

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/logout', logout)
router.get('/:partner_id/profile', getProfile)
router.patch('/:partner_id/status', updatePartnerStatus)

router.post('/confirmEmail', confirmEmail)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)
router.patch('/updateMyPassword', protect, updatePassword)

router.patch('/updateMe', protect, updateMe)
router.delete('/deleteMe', protect, deleteMe)

router.route('/').get(getAllPartners)
router.route('/:id').get(getPartner).patch(updatePartner)

module.exports = router
