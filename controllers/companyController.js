const Company = require('./../models/companyModel')

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create()

    res.status(200).json({
      status: 'success',
      data: { company },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    })
  }
}

exports.updateCompany = async (req, res) => {
  try {
    const companyData = req.body.company || req.body

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id },
      companyData,
      {
        new: true,
        runValidators: true,
        context: 'query',
      },
    )

    if (!company) {
      return res.status(404).json({
        status: 'fail',
        message: 'Company not found',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { company },
    })
  } catch (err) {
    console.error('Update error:', err)
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

exports.getAllCompany = async (req, res) => {
  try {
    const company = await Company.findOne()

    res.status(200).json({
      status: 'success',
      totals: 1,
      data: { company },
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    })
  }
}
