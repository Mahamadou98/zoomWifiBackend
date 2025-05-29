const crypto = require('crypto')
const { promisify } = require('util')
const Partner = require('./../models/partnerModel')
const AccessPoint = require('./../models/accessPointModel')
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
    data: {
      user,
    },
  })
}

exports.signup = async (req, res, next) => {
  try {
    const newPartner = await Partner.create({
      establishmentName: req.body.establishmentName,
      managerFirstName: req.body.managerFirstName,
      managerLastName: req.body.managerLastName,
      establishmentType: req.body.establishmentType,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country,
      city: req.body.city,
      address: req.body.address,
      connectionType: req.body.connectionType,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    })
    console.log('log data:', newPartner)
    createSendToken(newPartner, 201, res)
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
      new AppError('Veuillez bien entrer votre email et le mot de passe', 400),
    )
  }
  // check if user exists and password is correct
  const partner = await Partner.findOne({ email }).select('+password')

  if (
    !partner ||
    !(await partner.correctPassword(password, partner.password))
  ) {
    return next(new AppError('Email ou mot de passe incorrect', 401))
  }

  // if everything ok, send token to client
  createSendToken(partner, 200, res)
}

exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  await Partner.findByIdAndUpdate(req.body.id, { lastSeen: new Date() })

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
  const currentUser = await Partner.findById(decoded.id)
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
    // Get user based on Posted email
    const user = await Partner.findOne({ email: req.body.email })
    if (!user) {
      return next(
        new AppError(
          'Cette adresse mail ne correspond a aucun utilisateur',
          404, // 404 page not found
        ),
      )
    }

    // Generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

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

  const user = await Partner.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // Update changedPassword property for the user
  //Log the user in, sent JWT
  createSendToken(user, 200, res)
}

exports.updatePassword = async (req, res, next) => {
  try {
    // Get user from the collection
    const user = await Partner.findById(req.user.id).select('+password')

    // Check if the current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Votre ancient mot de passe est incorrect', 401))
    }

    // If so, update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    // Log user in, sent JWT token
    createSendToken(user, 200, res)
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// crud partner
exports.getAllPartners = async (req, res) => {
  try {
    // Disable caching for this response
    res.set('Cache-Control', 'no-store')

    const feature = new APIFeatures(Partner.find(), req.query)
      .filter()
      .paginate()

    const partnes = await feature.query
    const totals = await Partner.countDocuments()

    res.status(200).json({
      status: 'success',
      totals: totals,
      data: { partnes },
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.getPartner = async (req, res) => {
  try {
    // const partner = await Partner.findById(req.params.id).populate(
    //   'accessPoints',
    // )
    const accessPoint = await AccessPoint.find({
      partner: req.params.id,
    })

    res.status(200).json({
      status: 'success',
      data: { accessPoint },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.getAcessPointsByPartnerId = async (req, res) => {
  console.log('hello world')
  try {
    const accessPoint = await AccessPoint.find({
      partner: req.params.partner,
    })

    res.status(200).json({
      status: 'success',
      data: { accessPoint },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.partner_id).select(
      '-accessPoints',
    )
    res.status(200).json({
      status: 'success',
      data: { partner },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.confirmEmail = async (req, res, next) => {
  try {
    // Get partner based on ID
    const partner = await Partner.findOne({ email: req.body.email })
    if (!partner) {
      return next(
        new AppError('Aucun partenaire trouvé avec cet identifiant', 404),
      )
    }

    // Create activation message
    const message = `Cher/Chère ${partner.managerFirstName},\n\n
    Nous sommes ravis de vous informer que votre compte partenaire pour ${partner.establishmentName} a été activé avec succès.\n
    Vous pouvez maintenant vous connecter à votre compte et commencer à utiliser nos services.\n\n
    Cordialement,\n
    L'équipe ZoomWifi`

    try {
      await sendEmail({
        email: partner.email,
        subject: 'Activation de votre compte ZoomWifi',
        message,
      })

      res.status(200).json({
        status: 'success',
        message: 'Email de confirmation envoyé avec succès',
      })
    } catch (err) {
      return next(
        new AppError(
          "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer plus tard",
          500,
        ),
      )
    }
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    })
  }
}

exports.updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      status: 'success',
      data: { partner },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
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
  const updatedUser = await Partner.findByIdAndUpdate(
    req.user.id,
    updatedData,
    {
      new: true,
      runValidators: true,
    },
  )

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  })
}

exports.deleteMe = async (req, res, next) => {
  try {
    await Partner.findOneAndUpdate(req.user.id, { active: false })

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

exports.updatePartnerStatus = async (req, res) => {
  try {
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

    const partner = await Partner.findByIdAndUpdate(
      req.params.partner_id,
      { active: req.body.active },
      {
        new: true,
        runValidators: true,
        select: 'establishmentName email active', // Only return necessary fields
      },
    )

    if (!partner) {
      return res.status(404).json({
        status: 'fail',
        message: 'No partner found with that ID',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { partner },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}
