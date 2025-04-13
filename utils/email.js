const nodemailer = require('nodemailer')

const sendEmail = async options => {
  // create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  // define the email options
  const mailOptions = {
    from: 'Hadj digital agence <it.mk2017@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  }

  // send the email
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
