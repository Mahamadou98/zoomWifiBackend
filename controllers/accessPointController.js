const AccessPoint = require('./../models/accessPointModel')
const Partner = require('./../models/partnerModel')

exports.getAllAccessPoint = async (req, res) => {
  try {
    const accessPoints = await AccessPoint.find()

    res.status(200).json({
      status: 'success',
      Totals: accessPoints.length,
      data: { accessPoints },
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.createAccessPoint = async (req, res) => {
  try {
    // Ensure the partner exists
    const partner = await Partner.findById(req.body.partner)

    if (!partner) {
      console.log('error first attemp:')
      throw new Error('Partner not found')
    }

    const accessPoint = await AccessPoint.create(req.body)

    // Update the partner's accessPoints array
    partner.accessPoints.push(accessPoint._id)

    await partner.save()

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

// exports.getAllAccessPointsByPartner = async (req, res) => {
//   console.log("let's got")
//   try {
//     // const accessPoints = await AccessPoint.findById(req.params.partnerId)
//     const accessPoint = await AccessPoint.find({
//       partner: req.params.partnerId,
//     })

//     res.status(200).json({
//       status: 'success',
//       data: { accessPoint },
//     })
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     })
//   }
// }
exports.getAccessPoint = async (req, res) => {
  try {
    const accessPoint = await AccessPoint.findById(req.params.id)

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

exports.updateAccessPoint = async (req, res) => {
  try {
    const accessPoint = await AccessPoint.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )

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

exports.deleteAccessPoint = async (req, res) => {
  try {
    const accessPoint = await AccessPoint.findByIdAndDelete(req.params.id)

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
