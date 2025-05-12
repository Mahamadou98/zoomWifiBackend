const crypto = require('crypto')
const { promisify } = require('util')
const Admin = require('./../models/adminModel')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')
const { throws } = require('assert')
const APIFeatures = require('../utils/apiFeatures')

const signinToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signinToken(user._id)

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions)

  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    active: user.active,
    data: {
      user,
    },
  })
}

exports.signup = async (req, res, next) => {
  try {
    const newAdmin = await Admin.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      role: req.body.role,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    })

    createSendToken(newAdmin, 201, res)
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body

  // check email and password exist
  if (!email || !password) {
    return next(
      new AppError('Veuillez bien entrer votre numero et le mot de passe', 400),
    )
  }
  // check if admin exists and password is correct
  const admin = await Admin.findOne({ email })
    .select('+password')
    .populate('connexions')

  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError('Numero ou mot de passe incorrect', 401))
  }

  // if everything ok, send token to client
  createSendToken(admin, 200, res)
}

exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  await Admin.findByIdAndUpdate(req.body.id, { lastSeen: new Date() })

  res.status(200).json({ status: 'success' })
}

exports.protect = async (req, res, next) => {
  // Getting token and check of it's there
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(
      new AppError('Pardon veuillez vous connecter pour avoir acces', 401),
    )
  }

  // Verification token
  let decoded
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    })
  }

  // Check if user still exists
  const currentUser = await Admin.findById(decoded.id)
  if (!currentUser) {
    return next(
      new AppError("L'utilisateur a qui appartient ce token n'existe plus"),
    )
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Utilisateur a recement changer le mot de passe. veuillez vous connecter encore',
        401,
      ),
    )
  }

  // Grant access to the protected route
  req.user = currentUser
  next()
}

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "Vous n'avez pas la permission d'accomplir cette action",
          403, // 403 error forbidden
        ),
      )
    }
    next()
  }
}

exports.forgotPassword = async (req, res, next) => {
  try {
    // Get admin based on Posted email
    const admin = await Admin.findOne({ email: req.body.email })
    if (!admin) {
      return next(
        new AppError(
          'Cette adresse mail ne correspond a aucun utilisateur',
          404, // 404 page not found
        ),
      )
    }

    // Generate the random reset token
    const resetToken = admin.createPasswordResetToken()
    await admin.save({ validateBeforeSave: false })

    // Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`

    const message = `Avez-vous oublier votre mot de passe? donc veuillez soumettre 
    un autre mot de passe et n'oublier pas de confirmer a l'adresse ${resetURL}.\n
    Si vous n'avez pas oublier votre mot de passe alors ignorer ce message`

    try {
      await sendEmail({
        email: user.email,
        subject:
          'token de renitialisation de mot de passe (valide pour 10 minutes)',
        message,
      })

      res.status(200).json({
        status: 'succes',
        message: 'Token sent to email',
      })
      console.log('Email sent...')
    } catch (err) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined

      await user.save({ validateBeforeSave: false })

      return next(
        new AppError(
          'There was an error sending the email. Try again later',
          500,
        ),
      )
    }
    //
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    })
  }
}
exports.resetPassword = async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const admin = await Admin.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  // If token has not expired, and there is user, set the new password
  if (!admin) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  admin.password = req.body.password
  admin.passwordConfirm = req.body.passwordConfirm
  admin.passwordResetToken = undefined
  admin.passwordResetExpires = undefined
  await admin.save()

  // Update changedPassword property for the user
  //Log the user in, sent JWT
  createSendToken(admin, 200, res)
}

exports.updatePassword = async (req, res, next) => {
  try {
    // Get user from the collection
    const admin = await Admin.findById(req.user.id).select('+password')

    // Check if the current password is correct
    if (
      !(await admin.correctPassword(req.body.passwordCurrent, admin.password))
    ) {
      return next(new AppError('Votre ancient mot de passe est incorrect', 401))
    }

    // If so, update password
    admin.password = req.body.password
    admin.passwordConfirm = req.body.passwordConfirm
    await admin.save()

    // Log user in, sent JWT token
    createSendToken(admin, 200, res)
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    })
  }
}

exports.getAllAdmins = async (req, res, next) => {
  try {
    // const admins = await Admin.find().select('+active')

    const feature = new APIFeatures(Admin.find().select('+active'), req.query)
      .filter()
      .paginate()

    const admins = await feature.query

    res.status(200).json({
      status: 'success',
      Totals: admins.length,
      data: { admins },
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}
exports.deleteAdmin = async (req, res, next) => {
  try {
    // await Admin.findOneAndUpdate(req.params.id, { active: false })
    const admin = await Admin.findOneAndDelete(req.params.id)
    console.log('Deleting admin...')
    res.status(200).json({
      status: 'success',
      data: {
        user: admin,
      },
    })
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.activateAdmin = async (req, res, next) => {
  console.log('Activating admin...', req.body)
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

    const admin = await Admin.findByIdAndUpdate(
      req.params.adminId,
      { active: req.body.active },
      {
        new: true,
        runValidators: true,
        select: 'firstName, lastName email active', // Only return necessary fields
      },
    )

    if (!admin) {
      return res.status(404).json({
        status: 'fail',
        message: 'No admin found with that ID',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { admin },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}
