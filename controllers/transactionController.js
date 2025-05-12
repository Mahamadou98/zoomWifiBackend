const Transaction = require('../models/transactionModel')
const User = require('../models/userModel')
const Partner = require('../models/partnerModel')
const Admin = require('../models/adminModel')
const APIFeatures = require('../utils/apiFeatures')

/**
 * Common transaction validation logic used by both transaction functions
 * @param {Object} data - Transaction data
 * @returns {Object|null} - Error object if validation fails, null if validation passes
 */
const validateTransactionData = async data => {
  const { receiverId, senderId, isPartner, amount, type } = data

  // 1. Validate required fields
  if (!receiverId || !senderId || !amount || !type) {
    return {
      statusCode: 400,
      status: 'fail',
      message:
        'Please provide receiverId, senderId, amount, and transactionType',
    }
  }

  // 3. Check if partner exists
  const admin = await Admin.findById(senderId)
  if (!admin) {
    return {
      statusCode: 404,
      status: 'fail',
      message: 'Admin not found',
    }
  }
  if (admin.active === false) {
    return {
      statusCode: 404,
      status: 'fail',
      message: 'Admin not activated',
    }
  }

  if (isPartner === false) {
    console.log('start 2 user')
    // 2. Check if user exists
    const user = await User.findById(receiverId)
    if (!user) {
      return {
        statusCode: 404,
        status: 'fail',
        message: 'User not found',
      }
    }
    return { user, admin }
  }

  if (isPartner === true) {
    // Check if partner exists
    const partner = await Partner.findById(receiverId)

    if (!partner) {
      return {
        statusCode: 404,
        status: 'fail',
        message: 'Partner not found',
      }
    }
    return { partner, admin }
  }
}

/**
 * Creates a transaction initiated by a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createUserTransaction = async (req, res) => {
  try {
    var transaction
    // 1. Extract data from request body
    const { receiverId, senderId, amount, type, description, isPartner } =
      req.body

    // 2. Validate data
    const validationResult = await validateTransactionData({
      receiverId,
      senderId,
      isPartner,
      amount,
      type,
    })

    if (validationResult.status === 'fail') {
      console.log('error')
      return res.status(validationResult.statusCode).json({
        status: validationResult.status,
        message: validationResult.message,
      })
    }
    if (isPartner === false) {
      const { user, admin } = validationResult

      if (type === 'topup') {
        // 4. Create transaction record
        transaction = await Transaction.create({
          user: receiverId,
          admin: senderId,
          balance: amount,
          type,
          description: description || `${transactionType} transaction`,
        })
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid user transaction type. Use payment or topup.',
        })
      }
    } else {
      const { partner, admin } = validationResult

      if (type === 'topup') {
        // 4. Create transaction record
        transaction = await Transaction.create({
          partner: receiverId,
          admin: senderId,
          balance: amount,
          type,
          description: description || `${transactionType} transaction`,
        })
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid partner transaction type. Use payment or topup.',
        })
      }
    }

    // 5. Send successful response
    res.status(201).json({
      status: 'success',
      data: { transaction },
    })
  } catch (err) {
    console.error('User transaction error:', err)
    res.status(400).json({
      status: 'fail',
      message: err.message || 'Failed to process user transaction',
    })
  }
}

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const feature = new APIFeatures(Transaction.find(), req.query)
      .filter()
      .paginate()

    const transactions = await feature.query
    const totals = await Transaction.countDocuments()

    res.status(200).json({
      status: 'success',
      totals: totals,
      data: { transactions },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

exports.updateStatus = async (req, res) => {
  console.log('here i am ')
  try {
    const transactionId = req.params.id
    const { status, reason } = req.body

    // Validate status value
    const validStatuses = ['en attente', 'valide', 'rejete']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid status. Must be one of: pending, completed, failed, cancelled',
      })
    }

    // Check if transaction exists and update it
    const transaction = await Transaction.findById(transactionId)
      .populate('user')
      .populate('partner')
      .populate('admin')

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found',
      })
    }

    // Handle different logic based on whether it's a user or partner transaction
    if (transaction.user) {
      // Logic for user transactions
      if (status === 'valide') {
        // Update user balance when transaction is validated
        const user = transaction.user
        const admin = transaction.admin

        user.balance += transaction.balance
        admin.totalRecharge += transaction.balance
        await user.save({ validateBeforeSave: false })
        await admin.save({ validateBeforeSave: false })

        // Update the status
        transaction.status = status
        await transaction.save({ validateBeforeSave: false })

        // TODO: handle push notification to user
      } else {
        // Update the status
        transaction.status = status
        await transaction.save({ validateBeforeSave: false })

        // TODO: handle push notification to user
      }
    } else if (transaction.partner) {
      // Logic for partner transactions
      if (status === 'valide') {
        // Update partner balance when transaction is validated
        const partner = transaction.partner
        const admin = transaction.admin
        partner.balance += transaction.balance
        admin.totalRecharge += transaction.balance

        await partner.save({ validateBeforeSave: false })
        await admin.save({ validateBeforeSave: false })

        // Update the status
        transaction.status = status
        await transaction.save({ validateBeforeSave: false })

        // TODO: handle push notification to user
      } else {
        // Update the status
        transaction.status = status
        await transaction.save({ validateBeforeSave: false })
        console.log('here the reason', reason)
        // TODO: handle push notification to user
      }
    }
    const transactionObj = transaction.toObject()

    if (transactionObj.user) {
      transactionObj.user = {
        _id: transaction.user._id,
        firstName: transaction.user.firstName,
        lastName: transaction.user.lastName,
      }
    }

    if (transactionObj.partner) {
      transactionObj.partner = {
        _id: transaction.partner._id,
        establishmentName: transaction.partner.establishmentName,
      }
    }

    if (transactionObj.admin) {
      transactionObj.admin = {
        _id: transaction.admin._id,
        name: transaction.admin.firstName,
      }
    }

    res.status(200).json({
      status: 'success',
      data: { transaction: transactionObj },
    })
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    })
  }
}

// Get transaction by ID
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email')
      .populate('partner', 'name')

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { transaction },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.userId

    // Check if user exists
    const userExists = await User.exists({ _id: userId })
    if (!userExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      })
    }

    const transactions = await Transaction.find({ user: userId })
      .populate('partner', 'name')
      .sort('-date')

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: { transactions },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// Get partner transactions
exports.getPartnerTransactions = async (req, res) => {
  try {
    const partnerId = req.params.partnerId

    // Check if partner exists
    const partnerExists = await Partner.exists({ _id: partnerId })
    if (!partnerExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Partner not found',
      })
    }

    const transactions = await Transaction.find({ partner: partnerId })
      .populate('user', 'name email')
      .sort('-date')

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: { transactions },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          numTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' },
        },
      },
      {
        $sort: { _id: -1 }, // Sort by date descending
      },
    ])

    res.status(200).json({
      status: 'success',
      data: { stats },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}
