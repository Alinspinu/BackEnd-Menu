if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const axios = require('axios');
const querystring = require('querystring');
const { json } = require('body-parser');

const User = require('../models/user-true');

module.exports.getToken = async (req, res, next) => {
    try {
        const clientId = process.env.VIVA_CLIENT_ID_PRODUCTION;
        const clientSecret = process.env.VIVA_CLIENT_SECRET_PRODUCTION;
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const url = 'https://accounts.vivapayments.com/connect/token';
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`
        };
        const total = parseInt(req.query.total) * 100;
        const response = await axios.post(url, 'grant_type=client_credentials', { headers });
        const requestBody = {
            amount: total,
            customerTrns: 'Produse Delicioase',
            customer: {
                email: '',
                fullName: '',
                phone: '',
                countryCode: 'RO',
                requestLang: 'ro-RO'
            },
            paymentTimeout: 300,
            preauth: false,
            allowRecurring: false,
            maxInstallments: 12,
            paymentNotification: true,
            tipAmount: 100,
            disableExactAmount: false,
            disableCash: true,
            disableWallet: true,
            sourceCode: '8010',
            merchantTrns: '',
            tags: [

            ],
            cardTokens: [

            ]
        };
        token = response.data.access_token;
        console.log(token)
        const urlPayment = 'https://api.vivapayments.com/checkout/v2/orders';
        const response2 = await axios.post(urlPayment, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${response.data.access_token}`,
            }
        });
        console.log(response2.data)
        res.status(200).json(response2.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports.checkCashBack = async (req, res, next) => {
    try {
        let userCashBackBefore = 0;
        const { cartCashBack, userId, cartTotal } = req.body;
        const user = await User.findById(userId);
        userCashBackBefore = user.cashBack;
        const userCahBack = user.cashBack;
        if (userCahBack >= cartCashBack && cartTotal > 0) {
            user.cashBack = user.cashBack - cartCashBack;
            await user.save();
            const resData = {
                message: 'All good',
                userId: user._id,
                userCashBackBefore: userCashBackBefore,
                cartCashBack: cartCashBack
            };
            return res.status(200).json(resData);
        } else if (user.cashBack >= cartCashBack && cartTotal === 0) {
            user.cashBack = user.cashBack - cartCashBack;
            await user.save()
            const resData = {
                message: 'Value 0',
                userId: user._id,
                userCashBackBefore: userCashBackBefore,
                cartCashBack: cartCashBack
            }
            return res.status(200).json(resData);
        } else {
            return res.status(200).json({ message: `Valoarea de discount trimisă este mai mare decăt cea reală, în cont nu ai mai mult de ${user.cashBack} lei!` });
        }
    } catch (err) {
        console.log('Error', err.message)
        res.status(500).json({ message: err.message })
    }
}

module.exports.checkUser = async (req, res, next) => {
    try {
        const { user } = req.query;
        const ccb = parseFloat(req.query.ccb);
        const ucbb = parseFloat(req.query.ucbb);
        if (user) {
            const userDb = await User.findById(user);
            if (userDb) {
                if ((userDb.cashBack + ccb) === ucbb) {
                    userDb.cashBack = ucbb;
                    await userDb.save();
                    res.status(200).json({ message: 'User verified' });
                } else {
                    userDb.cashBack = ucbb;
                    await userDb.save();
                    res.status(226).json({ message: 'Something went wrong' });
                }
            }
        }
    } catch (err) {
        console.log('Error', err.message);
        res.status(500).json({ message: err.message });
    }
}