const nodemailer = require("nodemailer");

console.log(process.env.EMAIL_HOST)
console.log(process.env.EMAIL_PASS)
console.log(process.env.EMAIL_USER)

const transporter = nodemailer.createTransport({
  host: "mail.flowmanager.ro",
  port: 465,
  secure: true,
  auth: {
    user: "no-reply@flowmanager.ro",
    pass: "X,@OinUqjH}sS#}3"
  }
});

    // const transporter = nodemailer.createTransport({
    //     host: "mail.flowmanager.ro",
    //     port: 465,
    //     secure: true, // SSL
    //     auth: {
    //       user: "office@flowmanager.ro",
    //       pass: "MuhbGwP.V,K0bt%d"
    //     }
    // })

transporter.verify((err) => {
  if (err) {
    console.error("SMTP connection error:", err);
  } else {
    console.log("SMTP ready");
  }
});

module.exports = transporter;