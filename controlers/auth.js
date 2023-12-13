const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const querystring = require('querystring');
const { json } = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');
const User = require('../models/user-true');
const { findOneAndUpdate, findByIdAndUpdate } = require('../models/user-true');


module.exports.sendCustomer =async (req, res, next) => {
    try{
        const {id} = req.query;
        const customer = await User.findById(id).select('name email telphone cashBack');
        if(customer){
            res.status(200).json({message: 'All good', customer})
        } else {
            res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
        }
    } catch (err){
        console.log(err)
        res.status(500).json({message: 'Ceva nu a mers bine Eroare la cautare 500'})
    }
}


module.exports.newCustomer = async (req, res, next) => {
    try{
        const {name, email} = req.body;
        const check = await User.findOne({ email: email }).select('name telephone email cashBack');
        if (check) {
            return res.status(256).json({ message: 'This email allrady exist', customer: check });
        } else {
            const user = new User({
                name: name,
                email: email
            });
            const savedUser = await user.save();
            const customer = await User.findById(savedUser._id).select('name telephone email cashBack');
            sendCompleteRegistrationEmail(customer);
            res.status(200).json({message: 'All good', customer});
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
}



module.exports.sendEmailResetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email });
        if (user) {
            return sendResetEmail(user).then(response => {
                const userData = {
                    name: user.name,
                    email: user.email,
                    id: user.id,
                };
                if (response.message === 'Email sent') {
                    res.status(200).json({ message: response.message, user: userData })
                } else {
                    res.status(256).json({ message: response.message, user: userData })
                };
            });
        } else {
            res.status(404).json({ message: 'Adresa de email nu se află în baza de date!' })
        };
    } catch (err) {
        console.log('Error', err.message);
        res.status(500).json({ message: 'Server message' });
    }

}

module.exports.resetPassword = async (req, res, next) => {
    const { token, password, confirmPassword } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId);
            if (user) {
                if (password === confirmPassword) {
                    const hashedPassword = hashPassword(password);
                    user.password = hashedPassword;
                    await user.save();
                }
                const userData = {
                    token: token,
                    name: user.name,
                    admin: user.admin,
                    cashBack: user.cashBack,
                    email: user.email,
                    status: user.status,
                };
                const data = {name: user.name, action: 'și-a resetat parola'}
                await sendInfoAdminEmail(data)
                res.status(200).json(userData);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server Error' });
    };
}


module.exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if(!user.password){
        sendCompleteRegistrationEmail(user)
        return res.status(401).json({message: `Nu ți-ai terminat procesul de înregistrare. Ți-am mai trimis un mail la ${user.email}. Urmează pașii.`})
    }
    if (!user || !comparePasswords(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    };
    if (user.status === 'inactive') {
        return await sendVerificationEmail(user).then(response => {
            const userData = {
                name: user.name,
                email: user.email,
                id: user.id,
            };
            if (response.message === 'Email sent') {
                res.status(200).json({ message: response.message, user: userData })
            } else {
                res.status(256).json({ message: response.message, user: userData })
            };
        });
    } else if (user.status === "active") {
        let time = '15m';
        if (user.admin === 1) {
            time = '12h';
        };
        const token = jwt.sign({ userId: user._id }, process.env.AUTH_SECRET, { expiresIn: time });
        const sendData = {
            token: token,
            name: user.name,
            admin: user.admin,
            cashBack: user.cashBack,
            email: user.email,
            status: user.status,
            telephone: user.telephone,
        };
        const data = {name: user.name, action: 's-a conectat'}
        await sendInfoAdminEmail(data)
        res.status(200).json(sendData);
    };
};




module.exports.verifyToken = async (req, res, next) => {
    const { token } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId);
            if (user) {
                user.status = 'active';
                await user.save();
                const userData = {
                    token: token,
                    name: user.name,
                    admin: user.admin,
                    cashBack: user.cashBack,
                    email: user.email,
                    status: user.status,
                    telephone: user.telephone ? user.telephone : '-',
                    _id: user._id
                };
                const data = {name: user.name, action: 's-a inregistrat'}
                await sendInfoAdminEmail(data)
                res.status(200).json(userData);
            } else {
                res.status(404).json({ message: 'User not found' });
            };
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
}



module.exports.register = async (req, res, next) => {
    try{
        const { email, password, tel, confirmPassword, name, firstCart, survey, id } = req.body;
       if(id.length){
        if (password === confirmPassword) {
            const hashedPassword = hashPassword(password);
            const update = {
                password: hashedPassword,
                telephone: tel,
                survey: survey
            }
            const user = await User.findByIdAndUpdate(id, update, {new: true})
            
            res.status(200).json({ message: "Datele au fost actualizate.", user: user});
        } else {
            return res.status(401).json({ message: "Passwords don't match!" });
        };
       } else {
           const check = await User.find({ email: email });
           if (check.length) {
               return res.status(256).json({ message: 'This email allrady exist' });
           }
           if (password === confirmPassword) {
               const hashedPassword = hashPassword(password);
               const newUser = new User({
                   email: email,
                   password: hashedPassword,
                   name: name,
                   telephone: tel,
                   firstCart: firstCart,
                   survey: survey
               });
               console.log(newUser)
               await newUser.save();
               await sendVerificationEmail(newUser).then(response => {
                   if (response.message === 'Email sent') {
                       res.status(200).json({ message: response.message, id: newUser._id });
                   } else {
                       res.status(256).json({ message: response.message, id: newUser._id });
                   };
               });
           } else {
               return res.status(401).json({ message: "Passwords don't match!" });
           };
       }
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
};


function comparePasswords(password, hashedPassword) {
    const [salt, originalHash] = hashedPassword.split("$");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return hash === originalHash;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return [salt, hash].join("$");
}

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

async function sendInfoAdminEmail(data) {
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



async function sendCompleteRegistrationEmail(newUser) {
    const token = jwt.sign({ userId: newUser._id }, process.env.AUTH_SECRET, { expiresIn: '24h' });

    const templateSource = fs.readFileSync('views/layouts/mail.ejs', 'utf-8');
    const templateData = {
        link: `http://localhost:8101/register?token=${token}`,
        name: newUser.name,
        message: 'Prin acest email vrem sa-ți fimalizezi înregistrarea.'
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



