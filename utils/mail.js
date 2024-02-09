const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');


async  function sendInfoAdminEmail(data, adminEmail, gmail) {
    console.log(gmail)
    const templateSource = fs.readFileSync('views/layouts/info-admin.ejs', 'utf-8');
    const templateData = {
        name: data.name,
        action: data.action
    };
    const renderedTemplate = ejs.render(templateSource, templateData);

    let appKey = '0'
    jwt.verify(gmail.app, process.env.AUTH_SECRET, (err, decoded) => {
        if (err) {
        return  console.error('JWT verification failed:', err.message);
        } else {
        appKey = decoded.key
        }
      });

      if(appKey !== "0") {
          const transporter = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                  user: gmail.email,
                  pass: appKey
              }
          });
          const mailOptions = {
              from: gmail.email,
              to: adminEmail, // Assuming the email is present in the newUser object
              subject: 'Info',
              html: renderedTemplate
          };
      
          try {
              const info = await transporter.sendMail(mailOptions);
              console.log('Email sent:', info.response);
              return { message: 'Email sent' };
          } catch (error) {
              console.error('Error sending email:', error);
              return { message: 'Error sending email' };
          };
      }
};



async function sendVerificationEmail(newUser, baseUrlRedirect) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '15m' });
    
    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        link: `${baseUrlRedirect}verify-email?token=${token}`,
        name: newUser.name,
        message: 'Prin acest mesaj vrem să-ți confirmi adresa de email.',
        locatie: newUser.locatie.name
    };
    const renderedTemplate = ejs.render(templateSource, templateData);
    
    let appKey = '0'
    jwt.verify(newUser.locatie.gmail.app, process.env.AUTH_SECRET, (err, decoded) => {
        if (err) {
        return  console.error('JWT verification failed:', err.message);
        } else {
        appKey = decoded.key
        }
      });

      if(appKey !== "0") {
          const transporter = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                  user: newUser.locatie.gmail.email,
                  pass: appKey
              }
          });
          const mailOptions = {
              from: newUser.locatie.gmail.email,
              to: newUser.email, // Assuming the email is present in the newUser object
              subject: 'Verificare Email',
              html: renderedTemplate
          };
      
          try {
              const info = await transporter.sendMail(mailOptions);
              console.log('Email sent:', info.response);
              return { message: 'Email sent' };
          } catch (error) {
              console.error('Error sending email:', error);
              return { message: 'Error sending email' };
          };
      }

};



async function sendResetEmail(newUser, baseUrlRedirect) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '15m' });

    const templateSource = fs.readFileSync('views/layouts/resetPassword.ejs', 'utf-8');
    const templateData = {
        link: `${baseUrlRedirect}reset-password?token=${token}`,
        name: newUser.name,
        locatie: newUser.locatie.name,
    };
    const renderedTemplate = ejs.render(templateSource, templateData);

    let appKey = '0'
    jwt.verify(newUser.locatie.gmail.app, process.env.AUTH_SECRET, (err, decoded) => {
        if (err) {
        return  console.error('JWT verification failed:', err.message);
        } else {
        appKey = decoded.key
        }
      });

      if(appKey !== "0") {
        console.log(newUser.locatie.gmail.email)
              const transporter = nodemailer.createTransport({
                  service: 'Gmail',
                  auth: {
                      user: newUser.locatie.gmail.email,
                      pass: appKey
                  }
              });
          
              const mailOptions = {
                  from: newUser.locatie.gmail.email,
                  to: newUser.email,
                  subject: 'Resetare Parola',
                  html: renderedTemplate
              };
          
              try {
                  const info = await transporter.sendMail(mailOptions);
                  console.log('Email sent:', info.response);
                  return { message: 'Email sent' };
              } catch (error) {
                  console.error('Error sending email:', error);
                  return { message: 'Error sending email' };
              };
      }

};


async function sendMailToCustomer(data, emails) {
    const templateSource = fs.readFileSync('views/layouts/info-customer.ejs', 'utf-8');      
        const renderedTemplate = ejs.render(templateSource,{data: data});
    
        let appKey = '0'
        jwt.verify(data.locatie.gmail.app, process.env.AUTH_SECRET, (err, decoded) => {
            if (err) {
            return  console.error('JWT verification failed:', err.message);
            } else {
            appKey = decoded.key
            }
          });
    
          if(appKey !== "0") {
                  const transporter = nodemailer.createTransport({
                      service: 'Gmail',
                      auth: {
                          user: data.locatie.gmail.email,
                          pass: appKey
                      }
                  });
              
                  const mailOptions = {
                      from: data.locatie.gmail.email,
                      to: emails,
                      subject: 'Multumim pentru comandă',
                      html: renderedTemplate
                  };
              
                  try {
                      const info = await transporter.sendMail(mailOptions);
                      console.log('Email sent:', info.response);
                      return { message: 'Email sent' };
                  } catch (error) {
                      console.error('Error sending email:', error);
                      return { message: 'Error sending email' };
                  };
          }
};


module.exports = {
    sendResetEmail,
    sendVerificationEmail,
    // sendCompleteRegistrationEmail,
    sendInfoAdminEmail,
    // sendMailToCake,
    sendMailToCustomer,
  };



//   async function sendMailToCake(data, emails) {
//     const templateSource = fs.readFileSync('views/layouts/info-order.ejs', 'utf-8');
//     const renderedTemplate = ejs.render(templateSource,{data: data});

//     const transporter = nodemailer.createTransport({
//         service: 'Gmail',
//         auth: {
//             user: 'truefinecoffee@gmail.com',
//             pass: process.env.GMAIL_PASS
//         }
//     });

//     const mailOptions = {
//         from: 'truefinecoffee@gmail.com',
//         to: emails,
//         subject: 'Comandă Nouă',
//         html: renderedTemplate
//     };

//     try {
//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent:', info.response);
//         return { message: 'Email sent' };
//     } catch (error) {
//         console.error('Error sending email:', error);
//         return { message: 'Error sending email' };
//     };
// };



// async function sendCompleteRegistrationEmail(newUser, baseUrlRedirect) {
//     const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '24h' });

//     const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
//     const templateData = {
//         link: `${baseUrlRedirect}/register?token=${token}`,
//         name: newUser.name,
//         message: 'Prin acest email vrem sa-ți finalizezi înregistrarea cardului de fidelitate'
//     };
//     const renderedTemplate = ejs.render(templateSource, templateData);

//     const transporter = nodemailer.createTransport({
//         service: 'Gmail',
//         auth: {
//             user: 'truefinecoffee@gmail.com',
//             pass: process.env.GMAIL_PASS
//         }
//     });

//     const mailOptions = {
//         from: 'truefinecoffee@gmail.com',
//         to: newUser.email,
//         subject: 'Verificare Email',
//         html: renderedTemplate
//     };
//     try {
//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent:', info.response);
//         return { message: 'Email sent' };
//     } catch (error) {
//         console.error('Error sending email:', error);
//         return { message: 'Error sending email' };
//     };
// };