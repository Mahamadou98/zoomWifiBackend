const express = require('express')
const {
  createCompany,
  updateCompany,
  getAllCompany,
} = require('../controllers/companyController')

const router = express.Router()

router.post('/', createCompany)

router.patch('/:id', updateCompany)

// router.delete('/deleteMe/:id', protect, deleteAdmin)
router.route('/').get(getAllCompany)

module.exports = router
