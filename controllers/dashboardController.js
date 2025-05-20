const User = require('../models/userModel')
const Partner = require('../models/partnerModel')
const Transaction = require('../models/transactionModel')
const Admin = require('../models/adminModel')

exports.getDashboardData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Create date filter
    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const [totalUsers, totalPartners, totalTransactions, adminStats] =
      await Promise.all([
        User.countDocuments(dateFilter),
        Partner.countDocuments(dateFilter),
        Transaction.countDocuments(dateFilter),
        Admin.aggregate([
          {
            $match: dateFilter,
          },
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
