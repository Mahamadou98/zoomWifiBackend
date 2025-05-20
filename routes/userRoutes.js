const express = require('express')
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  loginAdmin,
} = require('./../controllers/authController')

const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getProfile,
  saveHistory,
  getUserHistories,
  getAllHistories,
  updateClientStatus,
  getCountries,
} = require('./../controllers/userController')

const router = express.Router()

router.post('/signup', signup)
router.post('/history', saveHistory)
router.post('/userHistories', getUserHistories)
router.get('/getAllHistoris', getAllHistories)
router.post('/login', login)
router.get('/logout', logout)
router.get('/:client_id/profile', getProfile)

// Countries
router.get('/countries', getCountries)

router.patch('/updateClientStatus/:clientId', updateClientStatus)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)
router.patch('/updateMyPassword', protect, updatePassword)

router.patch('/updateMe', protect, updateMe)
router.delete('/deleteMe/:id', deleteMe)
// router.get("/", protect, getAllUsers);

router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

module.exports = router
