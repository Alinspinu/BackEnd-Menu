const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const transporter = require("./transporter");
const {decryptData} =require ('./functions')


async  function sendInfoAdminEmail(data, adminEmail, locatie) {
    const templateSource = fs.readFileSync('views/layouts/info-admin.ejs', 'utf-8');
    const templateData = {
        name: data.name,
        action: data.action,
        prompt: data.prompt ? data.prompt : ''
    };
    const renderedTemplate = ejs.render(templateSource, {data: templateData});
        const mailOptions = {
            from:  `"${locatie}" <${"no-reply@flowmanager.ro"}>`,
            to: adminEmail, // Assuming the email is present in the newUser object
            subject: 'Info Admin',
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

async function sendBillToCustomer(buffer, email, locatie, text, pdf) {
    let content =  pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    let ext = pdf ? '.pdf' : '.xlsx'
    const mailOptions = {
        from: `"${locatie}" <${"no-reply@flowmanager.ro"}>`,
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
    let url = getLogoUrl(newUser.locatie.name)
    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        otp: newUser.otp,
        name: newUser.name,
        locatie: newUser.locatie.name,
        logoUrl: url
    };
    const renderedTemplate = ejs.render(templateSource, {data: templateData});    
        const mailOptions = {
            from: `"${newUser.locatie.name}" <${"no-reply@flowmanager.ro"}>`,
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




async function sendEmployeeEmail(newUser, baseUrlRedirect, message = 'Continuă înregistrarea') {
    let url = getLogoUrl(newUser.locatie.name)
    const token = jwt.sign({ userId: newUser._id, name: newUser.name, telephone: newUser.telephone, email: newUser.email, locatie: newUser.locatie}, process.env.AUTH_SECRET, { expiresIn: '24h' });
    const templateSource = fs.readFileSync( 'views/layouts/employee.ejs', 'utf-8');
    const templateData = {
        link: `${baseUrlRedirect}register?token=${token}`,
        name: newUser.name,
        message: message,
        locatie: newUser.locatie.name,
        logoUrl: url
    };
    const renderedTemplate = ejs.render(templateSource, templateData);    
        const mailOptions = {
            from:`"${newUser.locatie.name}" <${"no-reply@flowmanager.ro"}>`,
            to: newUser.email, 
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

};



async function sendResetEmail(newUser, baseUrlRedirect) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '15m' });

    const templateSource = fs.readFileSync('views/layouts/resetPassword.ejs', 'utf-8');

    let url = getLogoUrl(newUser.locatie.name)
    const templateData = {
        link: `${baseUrlRedirect}reset-password?token=${token}`,
        name: newUser.name,
        locatie: newUser.locatie.name,
        logoUrl: url
    };
    const renderedTemplate = ejs.render(templateSource, {data: templateData});
    
        const mailOptions = {
            from: `"${newUser.locatie.name}" <${"no-reply@flowmanager.ro"}>`,
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

};


async function sendMailToCustomer(data, emails) {
    const templateSource = fs.readFileSync('views/layouts/new-mail.ejs', 'utf-8');
        let url = getLogoUrl(data.salePoint.locatie.name)
        const renderedTemplate = ejs.render(templateSource,{data: data, url: url});
              
            const mailOptions = {
                from:`"${data.salePoint.name}" <${"no-reply@flowmanager.ro"}>`,
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
};




async function sendEmailSmtp(reservation, cancel){
    let url = getLogoUrl(reservation.locatie.name)
    const templateSource = fs.readFileSync('views/layouts/reservation.ejs', 'utf-8'); 
    const renderedTemplate = ejs.render(templateSource,{reservation: reservation, logoUrl: url, cancelUrl: cancel});

    const mailOptions = {
        from: `"${reservation.salePoint.name}" <${"no-reply@flowmanager.ro"}>`,
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
              
        const mailOptions = {
            from: `"${data.locatie.name}" <${"no-reply@flowmanager.ro"}>`,
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

};


function getLogoUrl(locatieName){
    if (locatieName === 'T ZERO') return 'https://res.cloudinary.com/dg7eza79w/image/upload/v1769858310/t-zero_bnvfsk.png';
    if (locatieName === 'True Fine Coffee') return 'https://res.cloudinary.com/dg7eza79w/image/upload/v1769858306/logo-true/logo-true-group_hxwb9h.svg';
    if (locatieName === 'Dune') return 'https://res.cloudinary.com/dg7eza79w/image/upload/v1769858302/dunelogo_zas9cn.png';
    return '';
  }





module.exports = {
    sendBillToCustomer,
    sendResetEmail,
    sendVerificationEmail,
    sendCompleteRegistrationEmail,
    sendInfoAdminEmail,
    // sendMailToCake,
    sendMailToCustomer,
    sendEmployeeEmail,
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