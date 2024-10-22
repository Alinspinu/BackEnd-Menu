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

const { round, sendToPrint, handleError } = require('../../utils/functions')
const {reports, inAndOut, printBill, posPayment, printNefiscal} = require('../../utils/print/printFiscal')
const {unloadIngs, uploadIngs} = require('../../utils/inventary')
const https = require('https');


const io = require('socket.io-client')
const socket = io("https://live669-0bac3349fa62.herokuapp.com")
// const socket = io("http://localhost:8090")

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
        handleError(err, res)
       return
    }
}

module.exports.cashInandOut = async (req, res, next) =>{
    try{
        const {data} = req.body;
     
       const message = await inAndOut(data.mode, data.sum)
        res.status(200).json({message: message.message})
    } catch(err) {
       handleError(err, res)
       return
    } 
}

module.exports.reprinFiscal = async (req, res, next) => {
    try{
        const {fiscal} = req.body
        if(fiscal){
            const bill = JSON.parse(fiscal)
            await printBill(bill)
            res.status(200).json({message: 'Bunul a fost retipărit!'})
        } else {
            res.status(226).json({message: 'Bonul nu a putut fi tipărit!'})
        }
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}

module.exports.printBill = async (req, res, next) => {
    try{
        const {bill} = req.body
        bill.status = 'done'
        bill.pending = false
        const email = bill.clientInfo.email
        socket.emit('printBill', JSON.stringify(bill))
        if(email && email.length){
            const client = await User.findOne({email: email})
            if(client){
                client.orders.push(bill)
                client.cashBack = round((client.cashBack - bill.cashBack) + (bill.total * client.cashBackProcent / 100))
                await client.save()
            }
        }
        delete bill._id
        const savedBill = await Order.findOneAndUpdate({soketId: bill.soketId}, bill, {new: true})
        socket.emit('billl', JSON.stringify(savedBill))
        if(savedBill){
        res.status(200).json({message: "Nota a fost salvată", bill: savedBill})
        } else {
            throw new Error('Nota de plată nu a putut fi salvată!')
        }
    } catch(err) {
        console.log(err)
        res.status(500).json(err)
    }
}



module.exports.saveBillInCloud = async (req, res, next) => {
    try{
        const {bill} = req.body
        bill.status = 'done'
        bill.pending = false
        const email = bill.clientInfo.email
        if(email && email.length){
            const client = await User.findOne({email: email})
            if(client){
                client.orders.push(bill)
                client.cashBack = round((client.cashBack - bill.cashBack) + (bill.total * client.cashBackProcent / 100))
            }
            await client.save()
        }
    
        const billl = await Order.findOne({soketId: bill.soketId})
    
        if(!billl){
            console.log('bill not found')
            delete bill._id
            const order = new Order(bill);
            const savedBill = await order.save()
            if(savedBill){
                savedBill.products.map((el) => {
                if (el.toppings.length) {
                    unloadIngs(el.toppings, el.quantity, { name: 'vanzare', details: el.name });
                }
                if (el.ings.length) {
                    unloadIngs(el.ings, el.quantity, { name: 'vanzare', details: el.name });
                }
            });
            res.status(200).json({message: "Nota a fost salvată", bill: savedBill})
            } else {
                throw new Error('Nota de plată nu a putut fi salvată!')
            }
        } else {
            billl.status = 'done'
            billl.pending = false
            billl.tips = bill.tips
            billl.total = bill.total
            billl.payment = bill.payment
            const savedBill = await billl.save()
            console.log('saved bill in cloud-- STATUS-', savedBill.status, 'payment---', savedBill.payment )
            billl.products.map((el) => {
                if (el.toppings.length) {
                    unloadIngs(el.toppings, el.quantity, { name: 'vanzare', details: el.name });
                }
                if (el.ings.length) {
                    unloadIngs(el.ings, el.quantity, { name: 'vanzare', details: el.name });
                }
            });
            res.status(200).json({message: "Nota a fost salvată", bill: savedBill})
        }
    } catch(err) {
        console.log(err)
        res.status(500).json(err)
    }
}




module.exports.printUnreg = async (req, res, next) => {
    try{
        const {bill} = req.body
        const response = await sendToPrint({nefiscal: bill}, 'print')
        res.status(200).json({message: 'Bonul a fost tipărit!'})
    } catch(err){
        handleError(err, res)
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
            const result = await sendToPrint({pos: sum}, 'print')
           if(result.data.ReceiptStatus){
               res.status(200).json({message: 'Plata efectuata cu success!', payment: true})
           } else {
               res.status(200).json({message: result.data.ErrorInfo, payment: false})
           }
        }
    }catch(err) {
      handleError(err, res)
    }   
}


