const User = require('../models/userModel')
const AppError = require('../utils/appError')
const Connexion = require('../models/connectionModel')
const Partner = require('../models/partnerModel')

exports.getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'This route is not implement',
  })
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
    await User.findOneAndUpdate(req.user.id, { active: false })

    res.status(204).json({
      status: 'success',
      data: null,
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
