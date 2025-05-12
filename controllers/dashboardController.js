const User = require('../models/userModel')
const Partner = require('../models/partnerModel')
const Transaction = require('../models/transactionModel')
const Admin = require('../models/adminModel')

exports.getDashboardData = async (req, res) => {
  try {
    const [totalUsers, totalPartners, totalTransactions, adminStats] =
      await Promise.all([
        User.countDocuments(),
        Partner.countDocuments(),
        Transaction.countDocuments(),
        Admin.aggregate([
          {
            $group: {
              _id: null,
              totalRechargeAmount: { $sum: '$totalRecharge' },
            },
          },
        ]),
      ])

    const totalRechargeAmount = adminStats[0]?.totalRechargeAmount || 0

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalPartners,
        totalTransactions,
        totalRechargeAmount,
      },
    })
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    })
  }
}
