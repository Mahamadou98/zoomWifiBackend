const crypto = require('crypto')
const { promisify } = require('util')
const User = require('./../models/userModel')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')
const { throws } = require('assert')

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
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      email: req.body.email,
      country: req.body.country,
      city: req.body.city,
      gender: req.body.gender,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    })
    // console.log('we are here!!')
    createSendToken(newUser, 201, res)
  } catch (err) {
    // console.log(err)
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.login = async (req, res, next) => {
  const { phone, password } = req.body

  // check email and password exist
  if (!phone || !password) {
    return next(
      new AppError('Veuillez bien entrer votre numero et le mot de passe', 400),
    )
  }
  // check if user exists and password is correct
  const user = await User.findOne({ phone })
    .select('+password')
    .populate('connexions')

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Numero ou mot de passe incorrect', 401))
  }

  // if everything ok, send token to client
  createSendToken(user, 200, res)
}

exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })
  await User.findByIdAndUpdate(req.body.id, { lastSeen: new Date() })

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
  const currentUser = await User.findById(decoded.id)
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
    const user = await User.findOne({ email: req.body.email })
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

  const user = await User.findOne({
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
    const user = await User.findById(req.user.id).select('+password')

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
