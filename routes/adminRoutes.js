const express = require('express')
const {
  signup,
  login,
  logout,
  protect,
  getAllAdmins,
  deleteAdmin, // id
  activateAdmin, // params: adminId
} = require('../controllers/adminController')
const { getDashboardData } = require('../controllers/dashboardController')

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.patch('/activateAdmin/:adminId', protect, activateAdmin)
router.get('/dashboard', protect, getDashboardData)

router.delete('/deleteMe/:id', protect, deleteAdmin)
router.route('/').get(getAllAdmins)

module.exports = router
