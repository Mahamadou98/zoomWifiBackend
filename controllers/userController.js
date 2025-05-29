const User = require('../models/userModel')
const AppError = require('../utils/appError')
const Connexion = require('../models/connectionModel')
const Partner = require('../models/partnerModel')
const APIFeatures = require('../utils/apiFeatures')
const Country = require('../models/countryModel')
const Transaction = require('../models/transactionModel')

exports.getAllUsers = async (req, res) => {
  try {
    const feature = new APIFeatures(User.find().select('+active'), req.query)
      .filter()
      .paginate()

    const clients = await feature.query
    const totals = await User.countDocuments()

    // Fetch both connections and transactions for each user
    const clientsWithHistory = await Promise.all(
      clients.map(async client => {
        // Fetch connections
        const connections = await Connexion.find({ clientId: client._id })
          .select(
            'establishmentName connectionDuration cost connectionType createdAt',
          )
          .sort('-createdAt')

        // Fetch transactions
        const transactions = await Transaction.find({ user: client._id })
          .select('balance type status description createdAt')
          .sort('-createdAt')

        return {
          ...client.toObject(),
          connections,
          transactions,
          totalConnections: connections.length,
          totalTransactions: transactions.length,
        }
      }),
    )

    res.status(200).json({
      status: 'success',
      totals,
      data: {
        clients: clientsWithHistory,
      },
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message || 'Error fetching users with history',
    })
  }
}

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'This route is not implement',
  })
}

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'This route is not implement',
  })
}

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'This route is not implement',
  })
}

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'This route is not implement',
  })
}

exports.updateMe = async (req, res, next) => {
  // create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route is not for password update, please use updateMyPassword Route',
        400,
      ),
    )
  }

  const filteredObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const updatedData = filteredObj(req.body, 'name', 'email')

  // update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedData, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  })
}

exports.deleteMe = async (req, res, next) => {
  try {
    // await User.findOneAndUpdate(req.user.id, { active: false })
    const client = await User.findByIdAndDelete(req.params.id)

    res.status(204).json({
      status: 'success',
      data: {
        user: { client },
      },
    })
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    })
  }
}

exports.getProfile = async (req, res) => {
  try {
    //console.log('user id in backend::', req.params.client_id)
    const user = await User.findById(req.params.client_id)
    res.status(200).json({
      status: 'success',
      data: { user },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.saveHistory = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.body.partnerId)

    const connexion = await Connexion.create({
      clientId: req.body.cliendId,
      establishmentName: partner.establishmentName,
      connectionDuration: req.body.connectionDuration,
      cost: req.body.cost,
      connectionType: req.body.connectionType,
    })

    console.log('connexion::', connexion)

    res.status(200).json({
      status: 'success',
      data: { connexion },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.getUserHistories = async (req, res, next) => {
  try {
    const { clientId } = req.body

    const histories = await Connexion.find({ clientId })

    res.status(200).json({
      status: 'success',
      results: histories.length,
      data: { histories },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || err,
    })
  }
}

exports.getAllHistories = async (req, res, next) => {
  try {
    const histories = await Connexion.find()

    res.status(200).json({
      status: 'success',
      results: histories.length,
      data: { histories },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || err,
    })
  }
}

exports.updateClientStatus = async (req, res) => {
  try {
    // Only allow updating the active status
    if (!req.body.hasOwnProperty('active')) {
      return res.status(400).json({
        status: 'fail',
        message: 'This route is only for updating partner status',
      })
    }

    // Ensure active is boolean
    if (typeof req.body.active !== 'boolean') {
      return res.status(400).json({
        status: 'fail',
        message: 'Active status must be boolean',
      })
    }

    const client = await User.findByIdAndUpdate(
      req.params.clientId,
      { active: req.body.active },
      {
        new: true,
        runValidators: true,
        select: 'firstName email active', // Only return necessary fields
      },
    )

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'No client found with that ID',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { client },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

exports.getCountries = async (req, res) => {
  try {
    if (!Country) {
      throw new Error('Country model not properly imported')
    }

    const rawCountries = await Country.find().select(
      'name cities tarifFibrePerMinute tarifDataPerMo',
    )

    // Transform the data to match the desired structure
    const transformedCountries = rawCountries.map(country => ({
      _id: country._id,
      name: country.name,
      tarifFibrePerMinute: country.tarifFibrePerMinute,
      tarifDataPerMo: country.tarifDataPerMo,
      cities: country.cities.map(city => city.name), // Extract only city names into array
    }))

    res.status(200).json({
      status: 'success',
      results: transformedCountries.length,
      data: { countries: transformedCountries },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message || 'Error fetching countries',
    })
  }
}
