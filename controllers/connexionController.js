const Connexion = require('./../models/connectionModel')
const User = require('./../models/userModel')

exports.getAllConnexions = async (req, res) => {
  try {
    const connexions = await Connexion.find()

    res.status(200).json({
      status: 'success',
      Totals: connexions.length,
      data: { connexions },
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.createConnexion = async (req, res) => {
  try {
    // Ensure the user exists
    console.log('here we are???')
    const user = await User.findById(req.body.user)
    console.log('here we are???', user)

    if (!user) {
      throw new Error('Client not found')
    }
    const connexion = await Connexion.create(req.body)

    // Update the client's connexion history array
    user.connexions.push(connexion._id)

    await user.save()

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

exports.getConnexion = async (req, res) => {
  try {
    const connexion = await Connexion.findById(req.params.id)

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

exports.deleteConnexion = async (req, res) => {
  try {
    const connexion = await Connexion.findByIdAndDelete(req.params.id)

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
