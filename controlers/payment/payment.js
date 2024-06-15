if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const axios = require('axios');
const querystring = require('querystring');
const { json } = require('body-parser');

const User = require('../../models/users/user');
const Voucher = require('../../models/utils/voucher')
const Order = require('../../models/office/product/order')
const Locatie = require('../../models/office/locatie')

const { round } = require('../../utils/functions')
const {reports, inAndOut, printBill, posPayment, printNefiscal} = require('../../utils/print/printFiscal')
const {unloadIngs, uploadIngs} = require('../../utils/inventary')
const https = require('https');

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
        const urlPayment = 'https://api.vivapayments.com/checkout/v2/orders';
        const response2 = await axios.post(urlPayment, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${response.data.access_token}`,
            }
        });
        res.status(200).json(response2.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



async function makeRequestWithRetry(url, expectedCondition, retries, delayTime) {
    const agent = new https.Agent({
        rejectUnauthorized: false
      });
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await axios.get(url, {headers: {'Content-Type': 'application/json'},httpsAgent: agent});
            if (expectedCondition(response)) {
                return response;
            }
            console.log(`Attempt ${attempt + 1} failed, retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempt + 1} encountered an error:`, error);
        }
        await delay(delayTime);
    }
    throw new Error(`Failed to get the expected response after ${retries} attempts`);
}




module.exports.getTokenForPos = async (req, res, next) => {
    const agent = new https.Agent({
        rejectUnauthorized: false
      });
    try{
        const {sessionId, amount, abort, loc} = req.query
        const locatie = await Locatie.findById(loc)
        if(locatie){
            const baseUrl = `https://${locatie.pos.vivaWalletLocal.ip}:${locatie.pos.vivaWalletLocal.port}/pos/v1/`
            if(abort === 'abort'){
                const abortUrl = `${baseUrl}abort`
                axios.post(abortUrl, {"sessionId": `${sessionId}`}, {headers: {'Content-Type': 'application/json'},httpsAgent: agent})
                .then(response => {
                    console.log('Abort succesful', response.data);
                    res.status(200).json(response.data)
                })
                .catch(error => {
                    console.error('Error in the abort process:', error);
                    res.status(500).json(err.message)
                });
            }else{
                const urlSearchPos = `${baseUrl}sale`
                const urlGetInfo = `${baseUrl}sessions/${sessionId}`
    
                const body = {             
                        "sessionId": `${sessionId}`,
                        "amount": amount*100,
                    }
                    console.log(urlSearchPos)
                    axios.post(urlSearchPos, body, {headers: {'Content-Type': 'application/json'},httpsAgent: agent})
                        .then(response => {
                            console.log('First request successful:', response.data);
                    
                            return delay(3000);
                        })
                        .then(() => {
                            return makeRequestWithRetry(urlGetInfo, 
                                response => response.data.payloadData, 
                                30, 
                                2500
                            );
                        })
                        .then(response => {
                            console.log('Second request successful:', response.data);
                            res.status(200).json(response.data)
                        })
                        .catch(error => {
                            console.error('Error in one of the requests:', error);
                            res.status(500).json(error)
                        });
            }
        } else {
            throw new Error(`Lipsete locatia, login!`);
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
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



module.exports.addVoucher = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
 try{
        const {code, value} = req.body
        const voucher = new Voucher({
            code: code,
            value: value,
            locatie: loc
        })
       const newVoucher =  await voucher.save()
        res.status(200).json({message: `Voucherul cu valoarea de ${newVoucher.value} lei a fost inregistrat cu succes!`})
 }catch(err){
    console.log(err)
    res.status(500).json(err)
 }
}

module.exports.checkVoucher = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        const {code} = req.body
        const voucher = await Voucher.findOne({code: code, locatie: loc})
        if(voucher){
         res.status(200).json({message: `Voucherul a fost găsit cu suma de ${voucher.value} lei!`, voucher: voucher})
        } else {
            res.status(226).json({message: 'Voucherul nu a fost gasit, codul voucherului este invalid sau nu a fost înregistrat!'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}  

module.exports.useVoucher = async (req, res, next) => {
    try{
        const {id} = req.body;
        const voucher = await Voucher.findByIdAndUpdate(id, {status: "invalid", value: 0}, {new: true})
        res.status(200).json({message: `Voucherul a vost folosit!`})
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}



module.exports.reports = async (req, res, next) => {
    try{
        const {value} = req.query;
        const response = await reports(value)
        res.status(200).json({message: response.message})
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.cashInandOut = async (req, res, next) =>{
    try{
        const {data} = req.body;
        const response = await inAndOut(data.mode, data.sum)
        res.status(200).json({message: response.message})
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    } 
}

module.exports.printBill = async (req, res, next) => {
    try{
        const {bill} = req.body
        bill.status = 'done'
        bill.pending = false
        const id = bill.clientInfo.userId
        if(id && id.length){
            const client = await User.findById(id)
            if(client){
                client.orders.push(bill)
                client.cashBack = round((client.cashBack - bill.cashBack) + (bill.total * client.cashBackProcent / 100))
            }
            await client.save()
        }
        const savedBill = await Order.findByIdAndUpdate(bill._id, bill, {new: true})
        if(savedBill){
            if(bill.total > 0) {
                printBill(savedBill)
                res.status(200).json({message: "Bonul a fos tipărit!", bill: savedBill})
            } else {
                res.status(200).json({message: "Nota de plata a fost salvată!", bill: savedBill})
            }
                savedBill.products.map((el) => {
                if (el.toppings.length) {
                    unloadIngs(el.toppings, el.quantity, { name: 'vanzare', details: el.name });
                }
                if (el.ings.length) {
                    unloadIngs(el.ings, el.quantity, { name: 'vanzare', details: el.name });
                }
            });
        } else {
            throw new Error('Nota de plată nu a putut fi salvată!')
        }
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.printUnreg = async (req, res, next) => {
    try{
        const {bill} = req.body
        printNefiscal(bill)
        res.status(200).json({message: 'Bonul a fost tipărit!'})

    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.changePaymentMethod = async (req, res, next) => {
    try{
        const {bill} = req.body
        await Order.findByIdAndUpdate(bill._id, bill)
        res.status(200).json({message: "Metoda de plata a fost schimbata"})
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.posPaymentCheck = async (req, res, next) => {
    try{
        const {sum} = req.body;
        if(sum){
           const result = await posPayment(sum)
           console.log(result.data)
           if(result.data.ReceiptStatus){
               res.status(200).json({message: 'Plata efectuata cu success!', payment: true})
           } else {
               res.status(200).json({message: result.data.ErrorInfo, payment: false})
           }
        }
    }catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}