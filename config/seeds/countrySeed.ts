const mongoos = require('mongoose')
const env = require('dotenv')
const Country = require('../../models/countryModel')

env.config()

// Connect to DB
mongoos
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connection successful!'))

const countriesData = [
  {
    name: "Côte d'Ivoire",
    code: 'CIV',
    currency: 'XOF',
    tarifFibrePerMinute: 1.66,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Abidjan', isCapital: false },
      { name: 'Yamoussoukro', isCapital: true },
      { name: 'Bouaké', isCapital: false },
      { name: 'San Pedro', isCapital: false },
      { name: 'Daloa', isCapital: false },
      { name: 'Korhogo', isCapital: false },
      { name: 'Man', isCapital: false },
      { name: 'Divo', isCapital: false },
      { name: 'Gagnoa', isCapital: false },
      { name: 'Abengourou', isCapital: false },
      { name: 'Grand-Bassam', isCapital: false },
      { name: 'Dabou', isCapital: false },
      { name: 'Bondoukou', isCapital: false },
      { name: 'Séguéla', isCapital: false },
      { name: 'Odienné', isCapital: false },
    ],
  },
  {
    name: 'Niger',
    code: 'NER',
    currency: 'XOF',
    tarifFibrePerMinute: 1.66,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Niamey', isCapital: true },
      { name: 'Zinder', isCapital: false },
      { name: 'Maradi', isCapital: false },
      { name: 'Agadez', isCapital: false },
      { name: 'Tahoua', isCapital: false },
      { name: 'Tillaberi', isCapital: false },
      { name: 'Diffa', isCapital: false },
      { name: 'Dosso', isCapital: false },
    ],
  },
  {
    name: 'Senegal',
    code: 'SEN',
    currency: 'XOF',
    tarifFibrePerMinute: 0.15,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Dakar', isCapital: true },
      { name: 'Thiès', isCapital: false },
      { name: 'Rufisque', isCapital: false },
    ],
  },
  {
    name: 'Mali',
    code: 'MLI',
    currency: 'XOF',
    tarifFibrePerMinute: 0.15,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Bamako', isCapital: true },
      { name: 'Sikasso', isCapital: false },
      { name: 'Mopti', isCapital: false },
    ],
  },
  {
    name: 'Burkina Faso',
    code: 'BFA',
    currency: 'XOF',
    tarifFibrePerMinute: 0.15,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Ouagadougou', isCapital: true },
      { name: 'Bobo-Dioulasso', isCapital: false },
      { name: 'Koudougou', isCapital: false },
    ],
  },
  {
    name: 'Ghana',
    code: 'GHA',
    currency: 'GHS',
    tarifFibrePerMinute: 0.18,
    tarifDataPerMo: 0.025,
    cities: [
      { name: 'Accra', isCapital: true },
      { name: 'Kumasi', isCapital: false },
      { name: 'Tamale', isCapital: false },
    ],
  },
  {
    name: 'Nigeria',
    code: 'NGA',
    currency: 'NGN',
    tarifFibrePerMinute: 0.2,
    tarifDataPerMo: 0.03,
    cities: [
      { name: 'Abuja', isCapital: true },
      { name: 'Lagos', isCapital: false },
      { name: 'Kano', isCapital: false },
      { name: 'Port Harcourt', isCapital: false },
    ],
  },
  {
    name: 'Cameroon',
    code: 'CMR',
    currency: 'XAF',
    tarifFibrePerMinute: 0.15,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Yaoundé', isCapital: true },
      { name: 'Douala', isCapital: false },
      { name: 'Garoua', isCapital: false },
    ],
  },
  {
    name: 'Congo',
    code: 'COG',
    currency: 'XAF',
    tarifFibrePerMinute: 0.15,
    tarifDataPerMo: 0.02,
    cities: [
      { name: 'Brazzaville', isCapital: true },
      { name: 'Pointe-Noire', isCapital: false },
      { name: 'Dolisie', isCapital: false },
    ],
  },
]

// Create countries
const seedCountries = async () => {
  try {
    await Country.deleteMany({}) // Clear existing countries
    const countries = await Country.create(countriesData)
    console.log(`Successfully seeded ${countries.length} countries`)
  } catch (error) {
    console.error('Error seeding countries:', error)
  }
  process.exit()
}

seedCountries()
