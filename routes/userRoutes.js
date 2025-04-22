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
} = require('./../controllers/userController')

const router = express.Router()

router.post('/signup', signup)
router.post('/history', saveHistory)
router.post('/login', login) //loginAdmin
router.post('/adminLogin', loginAdmin)
router.get('/logout', logout)
router.get('/:client_id/profile', getProfile)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)
router.patch('/updateMyPassword', protect, updatePassword)

router.patch('/updateMe', protect, updateMe)
router.delete('/deleteMe', protect, deleteMe)

router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

module.exports = router
