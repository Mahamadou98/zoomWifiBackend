const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
require('dotenv').config()
const colors = require('colors')
const connectDB = require('./config/db')
const cors = require('cors')

// Security npm packages
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const userRouter = require('./routes/userRoutes')
const partnerRouter = require('./routes/partnerRoutes')
const accessPointRouter = require('./routes/accessPointRoutes')
const connexionRouter = require('./routes/connexionRoutes')

const app = express()
//192.168.0.100:3000/api/v1
http: app.use(
  cors({
    // origin: process.env.CLIENT_URL || 'http://192.168.0.100:8081',
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// connect to Db
connectDB()

// GLOGABL MIDDLEWARES

// Set Security HTTP Headers
app.use(helmet())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Limit request from same API
const limiter = rateLimit({
  max: 100, // the number of request
  windowMs: 60 * 60 * 1000, // time in milsecond we define an hour
  message: 'Too many request from this IP, please try again in an hour!',
})
app.use('/api', limiter)

//body-parser reading data from req.body with the limit of 100kb
app.use(express.json({ limit: '100kb' }))

// Data sanitization against NoSQL Query injection
app.use(mongoSanitize())

// Data sanatizition against XSS
app.use(xss())

// Prevent parameter polution
// by removing the duplication in queryString
app.use(hpp())

// serving static files
app.use(express.static(`${__dirname}/public`))

// Test middleware
app.use((req, res, next) => {
  //   console.log(req.headers)
  next()
})

// app.use('/', (req, res) => {
//   console.log('test passed')
// })

// use app middleware
app.use('/api/v1/users', userRouter)
app.use('/api/v1/partner', partnerRouter)
app.use('/api/v1/accessPoint', accessPointRouter)
app.use('/api/v1/connexion', connexionRouter)

// Start server
const port = process.env.PORT || 5050
app.listen(port, () => console.log(`Server running on port ${port}`))
