const mongoose = require('mongoose')

const connectDB = async () => {
  // const conn = await mongoose.connect(process.env.MONGO_URI)

  // console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold)

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold,
    )
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold)
    process.exit(1)
  }
}

module.exports = connectDB
