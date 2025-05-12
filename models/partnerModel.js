const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const partnerSchemas = new mongoose.Schema({
  establishmentName: {
    type: String,
    required: [true, "Le nom d'etablissement est requis"],
    maxLength: [
      60,
      "Le nom d'etablissement ne devrais pas depasser 60 caracteres",
    ],
    minLength: [4, 'Le nom ne devrais pas etre au dessus de 4 caracteres'],
  },
  managerFirstName: {
    type: String,
    required: [true, 'Le nom du managere est requis'],
    maxLength: [60, 'Le nom du managere ne devrais pas depasser 60 caracteres'],
    minLength: [1, 'Le nom ne devrais pas etre au dessus de 4 caracteres'],
  },
  managerLastName: {
    type: String,
    required: [true, 'Le prenom du managere est requis'],
    maxLength: [
      60,
      'Le prenom du managere ne devrais pas depasser 60 caracteres',
    ],
    minLength: [4, 'Le nom ne devrais pas etre au dessus de 4 caracteres'],
  },
  establishmentType: {
    type: String,
    required: [true, "Le type d'etablissement est requis"],
    maxLength: [
      60,
      "Le type d'etablissement ne devrais pas depasser 60 caracteres",
    ],
    minLength: [
      4,
      "Le type d'etablissement ne devrais pas etre au dessus de 4 caracteres",
    ],
  },
  email: {
    type: String,
    required: [true, "l'address mail est requis"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Address mail doit etre une address valide'],
  },
  balance: {
    type: Number,
    default: 0,
  },
  phone: {
    type: String,
    unique: true,
    required: [true, 'votre numero de telephone est requis'],
    maxLength: [
      15,
      'le numero de telephone ne devrais pas exede 15 caracteres',
    ],
    minLength: [
      8,
      'le numero de telephone ne devrais pas etre au dessus de 8 caracteres',
    ],
  },
  country: {
    type: String,
    required: [true, 'Le nom du pays est requis'],
    maxLength: [30, 'Le nom du pays ne devrais pas depasser 30 caracteres'],
    minLength: [
      2,
      'Le nom du pays ne devrais pas etre au dessus de 4 caracteres',
    ],
  },
  city: {
    type: String,
    required: [true, 'Le nom du ville est requis'],
    maxLength: [20, 'Le nom ne devrais pas depasser 20 caracteres'],
    minLength: [
      4,
      'Le nom du ville ne devrais pas etre au dessus de 4 caracteres',
    ],
  },
  address: {
    type: String,
    required: [true, "L'address est requis"],
    maxLength: [50, "L'address ne devrais pas depasser 50 caracteres"],
    minLength: [4, "L'address ne devrais pas etre au dessus de 4 caracteres"],
  },
  connectionType: {
    type: String,
    required: [true, "L'address est requis"],
    maxLength: [20, "L'address ne devrais pas depasser 20 caracteres"],
    minLength: [4, "L'address ne devrais pas etre au dessus de 4 caracteres"],
  },
  lastSeen: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minLength: [8, 'Le mot de passe doit etre superieur a 8 caracteres'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, 'Veuillez confirmer votre mot de passe'],
    validate: {
      // this custom validator only work on create and save
      validator: function (el) {
        return el === this.password
      },
      message: 'erreur de confirmation de mot de passe',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: false,
    select: true,
  },
  accessPoints: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccessPoint',
    },
  ],
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  ],
})

// Hashed user password
partnerSchemas.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next()

  //Hash the password with the salt of 12
  this.password = await bcrypt.hash(this.password, 12)

  //delete passwordConfirm field
  this.passwordConfirm = undefined
  next()
})

partnerSchemas.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now() - 1000
  next()
})

partnerSchemas.pre(/^find/, function (next) {
  // This points to the current query
  //this.find({ active: { $ne: false | true } })
  next()
})

// create instance method
partnerSchemas.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

partnerSchemas.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    )
    return JWTTimestamp < changedTimestamp
  }
  // return false if password isn't change
  return false
}

partnerSchemas.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // will expire in 10mn

  return resetToken
}

const Partner = mongoose.model('Partner', partnerSchemas)

module.exports = Partner
