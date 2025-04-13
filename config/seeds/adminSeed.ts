const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../../models/userModel')

dotenv.config()

// Connect to DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connection successful!'))

// Admin user data
const adminUser = {
  firstName: 'Admin',
  lastName: 'Admin',
  phone: '22375757575',
  email: 'admin@zoomwifi.com',
  country: 'Mali',
  city: 'Bamako',
  gender: 'Male',
  password: process.env.ADMIN_PASSWORD || '12345qwert',
  passwordConfirm: process.env.ADMIN_PASSWORD_CONFIRM || '12345qwert',
  role: 'admin',
}

// Create admin user
const createAdmin = async () => {
  try {
    await User.deleteOne({ email: adminUser.email }) // Remove if exists
    const admin = await User.create(adminUser)
    console.log('Admin user created successfully:', admin.email)
  } catch (error) {
    console.error('Error creating admin:', error)
  }
  process.exit()
}

createAdmin()
