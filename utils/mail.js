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

async  function sendBillToCustomer(buffer, email, gmail, text, pdf) {

    const appKey = decryptData(gmail.app.key, gmail.app.secret, gmail.app.iv);

          let content =  pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          let ext = pdf ? '.pdf' : '.xlsx'
          const transporter = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                  user: gmail.email,
                  pass: appKey
              }
          });
          const mailOptions = {
              from: gmail.email,
              to: email, 
              subject: `${text}`,
              text: `Gasiți ${text.toLowerCase()} dumneavoastră atașat.`,
              attachments: [
                {
                  filename: `${text}${ext}`,
                  content: buffer,
                  contentType: content
                }
              ]
             
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
        locatie: newUser.locatie.name,
        logoUrl: newUser.locatie.name === 'T ZERO' ? 'https://res.cloudinary.com/dhetxk68c/image/upload/v1758656623/t_tyszya.svg' : 'https://res.cloudinary.com/dhetxk68c/image/upload/v1745824224/logo-true/logo-true-group_hxwb9h.svg'
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


async function sendEmployeeEmail(newUser, baseUrlRedirect, message = 'Continuă înregistrarea') {
    const token = jwt.sign({ userId: newUser._id, name: newUser.name, telephone: newUser.telephone, email: newUser.email, locatie: newUser.locatie}, process.env.AUTH_SECRET, { expiresIn: '24h' });
    console.log(newUser.locatie)
    const templateSource = fs.readFileSync( 'views/layouts/employee.ejs', 'utf-8');
    const templateData = {
        link: `${baseUrlRedirect}register?token=${token}`,
        name: newUser.name,
        message: message,
        locatie: newUser.locatie.name
    };
    const renderedTemplate = ejs.render(templateSource, templateData);
    
    const appKey = decryptData(newUser.locatie.gmail.app.key, newUser.locatie.gmail.app.secret, newUser.locatie.gmail.app.iv);
    // const appKey = decryptData('277f0c1e6a48ff27ab8bdcbeaa3917e914d4d1d5988c814127aa3ca3c9d94556', 'DX7droMGD0FBGUdLCY2yl/WdmA9qaqDy1AogHom2Bqg=', '694c0d5cb9f5190b1a768025b232c94b');

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

    let url = ''
    if(newUser.locatie.name === 'T ZERO') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1758656623/t_tyszya.svg'
    if(newUser.locatie.name === 'True Fine Coffee') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1745824224/logo-true/logo-true-group_hxwb9h.svg'
    if(newUser.locatie.name === 'Dune') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1762934542/dunelogo_zas9cn.png'
    const templateData = {
        link: `${baseUrlRedirect}reset-password?token=${token}`,
        name: newUser.name,
        locatie: newUser.locatie.name,
        logoUrl: url
    };
    const renderedTemplate = ejs.render(templateSource, {data: templateData});

    const appKey = decryptData(newUser.locatie.gmail.app.key,newUser.locatie.gmail.app.secret, newUser.locatie.gmail.app.iv);

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
        let url = ''
            if(data.locatie.name === 'T ZERO') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1758656623/t_tyszya.svg'
            if(data.locatie.name === 'True Fine Coffee') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1745824224/logo-true/logo-true-group_hxwb9h.svg'
            if(data.locatie.name === 'Dune') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1762934542/dunelogo_zas9cn.png'  
        const renderedTemplate = ejs.render(templateSource,{data: data, url: url});
    
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
            let url = ''
            if(reservation.locatie.name === 'T ZERO') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1758656623/t_tyszya.svg'
            if(reservation.locatie.name === 'True Fine Coffee') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1745824224/logo-true/logo-true-group_hxwb9h.svg'
            if(reservation.locatie.name === 'Dune') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1762934542/dunelogo_zas9cn.png'
        const renderedTemplate = ejs.render(templateSource,{reservation: reservation, logoUrl: url});
    
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
                      from: `"${reservation.salePoint.name}" <${reservation.locatie.gmail.email}>`,
                      to: reservation.client.email,
                      subject: reservation.status === 'canceled' ? 'Rezervare respinsă' : 'Rezervare acceptată',
                      html: renderedTemplate
                  };
              
                  try {
                      const info = await transporter.sendMail(mailOptions);
                      console.log('Email sent:', info);
                      return { message: 'Email sent' };
                  } catch (error) {
                      console.error('Error sending email:', error);
                      return { message: 'Error sending email' };
                  };
          }
};


async function sendEmailSmtp(reservation, cancel, host,  user, pass){
    let url = ''
    if(reservation.locatie.name === 'T ZERO') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1758656623/t_tyszya.svg'
    if(reservation.locatie.name === 'True Fine Coffee') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1745824224/logo-true/logo-true-group_hxwb9h.svg'
    if(reservation.locatie.name === 'Dune') url = 'https://res.cloudinary.com/dhetxk68c/image/upload/v1762934542/dunelogo_zas9cn.png'
    const templateSource = fs.readFileSync('views/layouts/reservation.ejs', 'utf-8'); 
    const renderedTemplate = ejs.render(templateSource,{reservation: reservation, logoUrl: url, cancelUrl: cancel});

    const transporter = nodemailer.createTransport({
        host: host || "mail.flowmanager.ro",
        port: 465,
        secure: true, // SSL
        auth: {
          user: user || "office@flowmanager.ro",
          pass: pass || "MuhbGwP.V,K0bt%d"
        }
    })

    const mailOptions = {
        from: `"${reservation.salePoint.name}" <${user || "office@flowmanager.ro"}>`,
        to: reservation.client.email,
        subject: reservation.status === 'canceled' ? 'Rezervare Anulată' : 'Rezervare acceptată',
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

async function sendAdminMessage(data, adminEmail = 'office@truefinecoffee.ro') {
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
                      to: adminEmail,
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
    sendBillToCustomer,
    sendResetEmail,
    sendVerificationEmail,
    sendCompleteRegistrationEmail,
    sendInfoAdminEmail,
    // sendMailToCake,
    sendMailToCustomer,
    sendEmployeeEmail,
    sendReservationEmail,
    sendAdminMessage,
    sendEmailSmtp
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