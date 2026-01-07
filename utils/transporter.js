const nodemailer = require("nodemailer");

consoel.log(process.env.EMAIL_HOST)
consoel.log(process.env.EMAIL_PASS)
consoel.log(process.env.EMAIL_USER)

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err) => {
  if (err) {
    console.error("SMTP connection error:", err);
  } else {
    console.log("SMTP ready");
  }
});

module.exports = transporter;