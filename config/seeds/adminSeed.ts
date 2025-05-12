const mongooses = require('mongoose')
const dotenvs = require('dotenv')
const Admin = require('../../models/adminModel')

dotenvs.config()

// Connect to DB
mongooses
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connection successful!'))

// Admin user data
const adminUser = {
  firstName: 'Admin',
  lastName: 'Admin',
  email: 'admin@zoomwifi.com',
  password: process.env.ADMIN_PASSWORD || '12345qwert',
  passwordConfirm: process.env.ADMIN_PASSWORD_CONFIRM || '12345qwert',
  role: 'super administrateur',
}

// Create admin user
const createAdmin = async () => {
  try {
    await Admin.deleteOne({ email: adminUser.email }) // Remove if exists
    const admin = await Admin.create(adminUser)
    console.log('Admin user created successfully:', admin.email)
  } catch (error) {
    console.error('Error creating admin:', error)
  }
  process.exit()
}

createAdmin()
