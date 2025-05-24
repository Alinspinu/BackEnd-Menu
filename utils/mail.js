const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const {decryptData} =require ('./functions')


async  function sendInfoAdminEmail(data, adminEmail, gmail) {
    const templateSource = fs.readFileSync('views/layouts/info-admin.ejs', 'utf-8');
    const templateData = {
        name: data.name,
        action: data.action,
        prompt: data.prompt ? data.prompt : ''
    };
    const renderedTemplate = ejs.render(templateSource, {data: templateData});
    const appKey = decryptData(gmail.app.key, gmail.app.secret, gmail.app.iv);

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
};



async function sendVerificationEmail(newUser) {
 
    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        otp: newUser.otp,
        name: newUser.name,
        locatie: newUser.locatie.name
    };
    const renderedTemplate = ejs.render(templateSource, {data: templateData});
    
    const appKey = decryptData(newUser.locatie.gmail.app.key, newUser.locatie.gmail.app.secret, newUser.locatie.gmail.app.iv);

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
              to: newUser.email, 
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


async function sendEmployeeEmail(newUser, baseUrlRedirect) {
    const token = jwt.sign({ userId: newUser._id}, process.env.AUTH_SECRET, { expiresIn: '24h' });
    
    const templateSource = fs.readFileSync('views/layouts/employee.ejs', 'utf-8');
    const templateData = {
        link: `${baseUrlRedirect}register?token=${token}`,
        name: newUser.name,
        message: 'Continuă procesul de înreistrare.',
        locatie: newUser.locatie.name
    };
    const renderedTemplate = ejs.render(templateSource, templateData);
    
    const appKey = decryptData(newUser.locatie.gmail.app.key, newUser.locatie.gmail.app.secret, newUser.locatie.gmail.app.iv);

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
              subject: 'Bine ai venit',
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
    const renderedTemplate = ejs.render(templateSource, {data: templateData});

    const appKey = decryptData(newUser.locatie.gmail.app.key,newUser.locatie.gmail.app.secret, newUser.locatie.gmail.app.iv);

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
    const templateSource = fs.readFileSync('views/layouts/new-mail.ejs', 'utf-8');      
        const renderedTemplate = ejs.render(templateSource,{data: data});
    
        const appKey = decryptData(data.locatie.gmail.app.key, data.locatie.gmail.app.secret, data.locatie.gmail.app.iv);
    
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

async function sendReservationEmail(reservation) {
    const templateSource = fs.readFileSync('views/layouts/reservation.ejs', 'utf-8');      
        const renderedTemplate = ejs.render(templateSource,{reservation: reservation});
    
        const appKey = decryptData(reservation.locatie.gmail.app.key, reservation.locatie.gmail.app.secret, reservation.locatie.gmail.app.iv);
    
          if(appKey !== "0") {
                  const transporter = nodemailer.createTransport({
                      service: 'Gmail',
                      auth: {
                          user: reservation.locatie.gmail.email,
                          pass: appKey
                      }
                  });
              
                  const mailOptions = {
                      from: reservation.locatie.gmail.email,
                      to: reservation.client.email,
                      subject: reservation.status === 'canceled' ? 'Rezervare respinsă' : 'Rezervare acceptată',
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

async function sendAdminMessage(data) {
    const templateSource = fs.readFileSync('views/layouts/contact.ejs', 'utf-8');      
        const renderedTemplate = ejs.render(templateSource,{data: data});
    
        const appKey = decryptData(data.locatie.gmail.app.key, data.locatie.gmail.app.secret, data.locatie.gmail.app.iv);
    
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
                      to: 'office@truefinecoffee.ro',
                      subject: 'Mesaj nou CONTACT',
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
    sendCompleteRegistrationEmail,
    sendInfoAdminEmail,
    // sendMailToCake,
    sendMailToCustomer,
    sendEmployeeEmail,
    sendReservationEmail,
    sendAdminMessage
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



async function sendCompleteRegistrationEmail(newUser, baseUrlRedirect, loc) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '24h' });

    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        link: `${baseUrlRedirect}register?token=${token}`,
        name: newUser.name,
        message: 'Acest cont ți-a fost creat în parteniriat cu Kinetic Sport & Medicine.',
        messageOne: 'Prin crearea acestui cont vei beneficia de un discount de 10% la toate produsele noastere și 5% cashback.',
        messageTwo: 'Ce trebuie să faci:',
        messageThree: '1. Activează-ti contul.',
        messageFour: '2. Folosește la casă, adresa de email sau codul qr generat în aplicatie, înainte de a achita nota de plată.',
        locatie: loc
    };
    const renderedTemplate = ejs.render(templateSource, templateData);

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'truefinecoffee@gmail.com',
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: 'truefinecoffee@gmail.com',
        to: newUser.email,
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
};