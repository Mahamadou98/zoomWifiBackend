const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Company = require('../../models/companyModel')

dotenv.config()

// Connect to DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connection successful!'))

// Company data
const companyData = {
  name: 'ZOOM WIFI',
  contact: '+225 07 00 00 00',
  city: 'Abidjan',
  email: 'contact@zoomwifi.com',
  address: 'Rue du Commerce, Plateau',
  country: "Côte d'Ivoire",
  commissionPercent: 40,
  partnerCommissionPercent: 60,
}

// Create company
const createCompany = async () => {
  try {
    await Company.deleteOne({ email: companyData.email }) // Remove if exists
    const company = await Company.create(companyData)
    console.log('Company created successfully:', company.name)
  } catch (error) {
    console.error('Error creating company:', error)
  }
  process.exit()
}
createCompany()
