const nodemailer = require("nodemailer");

console.log(process.env.EMAIL_HOST)
console.log(process.env.EMAIL_PASS)
console.log(process.env.EMAIL_USER)

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

    const transporter = nodemailer.createTransport({
        host: "mail.flowmanager.ro",
        port: 465,
        secure: true, // SSL
        auth: {
          user: "office@flowmanager.ro",
          pass: "MuhbGwP.V,K0bt%d"
        }
    })

transporter.verify((err) => {
  if (err) {
    console.error("SMTP connection error:", err);
  } else {
    console.log("SMTP ready");
  }
});

module.exports = transporter;