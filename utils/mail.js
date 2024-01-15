const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');


async function sendCompleteRegistrationEmail(newUser) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '24h' });

    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        link: `https://true-meniu.web.app/register?token=${token}`,
        name: newUser.name,
        message: 'Prin acest email vrem sa-ți finalizezi înregistrarea cardului de fidelitate'
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



async function sendCompleteRegistrationCustomer(newUser) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '24h' });

    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        link: `http://localhost:8101/register?token=${token}`,
        name: newUser.name,
        message: 'Prin acest email vrem sa-ți finalizezi înregistrarea cardului de fidelitate'
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



async  function sendInfoAdminEmail(data) {
    const templateSource = fs.readFileSync('views/layouts/info-admin.ejs', 'utf-8');
    const templateData = {
        name: data.name,
        action: data.action

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
        to: "alinz.spinu@gmail.com",
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
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '15m' });

    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        link: `https://true-meniu.web.app/verify-email?token=${token}`,
        name: newUser.name,
        message: 'Prin acest mesaj vrem să-ți confirmi adresa de email.'
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
};

async function sendResetEmail(newUser) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '15m' });

    const templateSource = fs.readFileSync('views/layouts/resetPassword.ejs', 'utf-8');
    const templateData = {
        // link: `https://true-meniu.web.app/verify-email?token=${token}`,
        link: `https://true-meniu.web.app/reset-password?token=${token}`,
        name: newUser.name

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


async function sendMailToCake(data, emails) {
    const templateSource = fs.readFileSync('views/layouts/info-order.ejs', 'utf-8');
    const renderedTemplate = ejs.render(templateSource,{data: data});

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'truefinecoffee@gmail.com',
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: 'truefinecoffee@gmail.com',
        to: emails,
        subject: 'Comandă Nouă',
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
    const templateSource = fs.readFileSync('views/layouts/info-customer.ejs', 'utf-8');      
        const renderedTemplate = ejs.render(templateSource,{data: data});
    
    
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'truefinecoffee@gmail.com',
                pass: process.env.GMAIL_PASS
            }
        });
    
        const mailOptions = {
            from: 'truefinecoffee@gmail.com',
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


module.exports = {
    sendResetEmail,
    sendVerificationEmail,
    sendCompleteRegistrationEmail,
    sendInfoAdminEmail,
    sendMailToCake,
    sendMailToCustomer,
    sendCompleteRegistrationCustomer
  };
