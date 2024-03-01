const Order = require('../../models/office/product/order');
const Table = require('../../models/utils/table')
const User = require ('../../models/users/user')
const DelProd = require('../../models/office/product/deletetProduct')

const {sendMailToCake, sendInfoAdminEmail, sendMailToCustomer} = require('../../utils/mail');
const {formatedDateToShow, round} = require('../../utils/functions')

const {unloadIngs, uploadIngs} = require('../../utils/inventary')

const {print} = require('../../utils/print/printOrders')
const {printBill, posPayment} = require('../../utils/print/printFiscal')

//************************SEND ORDERS********************** */

module.exports.getOrder = async (req, res, next) => {
    const {start, end, day, loc} = req.body
    if(start && end){
        const startTime = new Date(start).setHours(0,0,0,0)
        const endTime = new Date(end).setHours(23, 59, 59, 9999)
        const orders = await Order.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}})
        res.status(200).json({orders: orders, delProducts: delProds})
    }

    if(day && !end && !start) {
        const start = new Date(day).setHours(0,0,0,0)
        const end = new Date(day).setHours(23,59,59,9999)
        const orders = await Order.find({ locatie: loc , createdAt: {$gte: start, $lt: end}})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: start, $lt: end}})
        res.status(200).json({orders: orders, delProducts: delProds})
    }
    if(!day && !end && !start) {
        const today = new Date(Date.now()).setHours(0,0,0,0)
        const orders = await Order.find({ locatie: loc , createdAt: {$gte: today}})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: today}})
        res.status(200).json({orders: orders, delProducts: delProds})
    }
    try{
    } catch (err){
        console.log(err)
    }
}



module.exports.sendDeletedproduct = async (req, res, next) => {
    try{
        
        const delProds = DelProd.find({})
        re.status(200).json(delProds)
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }

}

module.exports.getOrderByUser = async (req, res, nex) => {
    try{
    const date = new Date()
    const start = new Date(date).setHours(0,0,0,0)
    const end = new Date(date).setHours(23, 59, 59, 999)
     const {userId} = req.query;
     const user = await User.findById(userId)
    const orders = await Order.find({locatie: user.locatie, 'employee.user': userId, status: 'done', updatedAt: {$gte: start, $lt: end} })   
    res.status(200).json(orders)
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.getAllOrders = async (req, res, next) => {
    try{
        const date = new Date()
        const start = new Date(date).setHours(0,0,0,0)
        const end = new Date(date).setHours(23, 59, 59, 999)
        const {loc} = req.query;
        const orders = await Order.find({locatie: loc, status: 'done', updatedAt: {$gte: start, $lt: end} }) 
        res.status(200).json(orders) 
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.orderDone = async (req, res, next) => {
    try{
        const { cmdId } = req.query
        const doc = await Order.findByIdAndUpdate(cmdId, { status: 'done' })
        console.log(` Success! Order ${cmdId} - status change to "done" `)
        res.status(200).json({message: 'All good, order is done'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.sendOrderTime = async (req, res, next) => {
    const orderId = req.query.orderId;
    const order = await Order.findById(orderId);
    if (order) {
        res.status(200).json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
}

//************************SAVE ORDERS********************** */



module.exports.saveOrEditBill = async (req, res, next) => {
    const {bill} = req.body;
    const parsedBill = JSON.parse(bill)
    const {index, billId} = req.query;
    try{
        if(billId === "new"){
            delete parsedBill._id
            delete parsedBill.index
            const table = await Table.findOne({index: index, locatie: parsedBill.locatie})
            const newBill = new Order(parsedBill);
            newBill.clientInfo = parsedBill.clientInfo
            if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
                newBill.user = parsedBill.clientInfo._id
            } 
            print(newBill)
            newBill.products.forEach(el => {
                if(el.sentToPrint && el.ings.length || el.sentToPrint && el.toppings.length ){
                    if(el.toppings.length){
                        unloadIngs(el.toppings, el.quantity);
                    } 
                    if(el.ings.length){
                        unloadIngs(el.ings, el.quantity);
                    }
                    el.sentToPrint = false;
                    console.log("new", el.sentToPrint)
                } else if(el.sentToPrint){
                    el.sentToPrint = false
                    console.log("new",el.sentToPrint)
                }
            })
            const savedBill = await newBill.save();
            table.bills.push(savedBill);
            await table.save();
            res.status(200).json({billId: savedBill._id, index: savedBill.index, products: savedBill.products, masa: {_id: table._id, index: table.index}})
        } else {
            print(parsedBill)
            parsedBill.products.forEach(el => {
                el.sentToPrint ? resaveOrder = true : resaveOrder = false
                if(el.sentToPrint && el.ings.length || el.sentToPrint && el.toppings.length) {
                    if(el.toppings.length){
                        unloadIngs(el.toppings, el.quantity);
                    } 
                    if(el.ings.length){
                        unloadIngs(el.ings, el.quantity);
                    }

                    el.sentToPrint = false;
                    console.log("old",el.sentToPrint)
                } else if(el.sentToPrint){
                    el.sentToPrint = false
                    console.log("old",el.sentToPrint)
                }
            })
            async function saveBill() {
                const order = await Order.findById(billId)
                if(order.status === "done"){
                    parsedBill.status = 'done'
                    parsedBill.payment = order.payment
                    parsedBill.pending = order.pending
                    const bill = await Order.findByIdAndUpdate(billId, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index'});
                    res.status(200).json({billId: bill._id, index: bill.index, products: bill.products, masa: bill.masaRest})
                } else {
                    const bill = await Order.findByIdAndUpdate(billId, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index'});
                    res.status(200).json({billId: bill._id, index: bill.index, products: bill.products, masa: bill.masaRest})
                }
            }
            setTimeout(saveBill, 1000)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: 'Something went wrong', err: err.message})
    }
}



module.exports.registerDeletedOrderProducts = async (req, res, next) => {
    const {product} = req.body
    const { ['_id']:_, ...newProduct } = product;
    const delProd = new DelProd(newProduct)
    delProd.employee.name = product.employee.fullName
    await delProd.save()
    res.status(200).json({message: 'The product was registred as deleted!'})
}



module.exports.uploadIngs = async (req, res, next) => {
    try{
        const {loc} = req.query
        const {ings, quantity} = req.body;
        if(ings && quantity){
            uploadIngs(ings, quantity)
        res.status(200).json({message: 'Success, stocul a fost actualizat!'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.saveOrder = async (req, res, next) => {
    try {
        const {order, adminEmail, loc} = req.body
        const newOrder = new Order(order) 
        if (order.user !== 'john doe') {
            const user = await User.findById(order.user);
            if (user) {
                newOrder.clientInfo.email = user.email
                newOrder.clientInfo.discount = user.discount
                newOrder.clientInfo.cashBack = user.cashBack
                newOrder.preOrder = true
                const savedOrder = await newOrder.save()
                const dbOrder = await Order.findById(savedOrder._id).populate({path: 'locatie'})
                console.log(`Order ${dbOrder._id} saved with the user ${user.name}!`)
                if(newOrder.masa > 0){
                    const table = await Table.findOne({locatie: loc , index: newOrder.masa});
                    if(table){
                        table.bills.push(savedOrder._id)
                        await table.save()
                    }
                }
                let action 
                if(order.payOnSite){
                    action = `a dat o comanda pe care o plătește în locație cu cashBack ${order.cashBack}`
                } 
                if(order.payOnline){
                    action = `a dat o comanda pe care a plătito online cu cashBack ${order.cashBack}`
                }
                await sendMailToCustomer(dbOrder,[`${adminEmail}`, `${user.email}`])
                res.status(200).json({ user: user, orderId: newOrder._id, orderIndex: newOrder.index, preOrderPickUpDate: newOrder.preOrderPickUpDate });
            }
        } else {
            order.preOrder = true
            const savedOrder = await newOrder.save();
            const dbOrder = await Order.findById(savedOrder._id).populate({path: 'locatie'})
            console.log(`Order ${dbOrder._id} saved without a user!`)
            if(newOrder.masa > 0){
                const table = await Table.findOne({locatie: loc , index: newOrder.masa});
                if(table){
                    table.bills.push(savedOrder._id)
                    await table.save()
                }
            }

            const data = {name: 'No user', action: 'a dat o comanda ce a fost platita Online'}
            await sendInfoAdminEmail(data, adminEmail, dbOrder.locatie.gmail)
            res.status(200).json({ message: 'Order Saved Without a user', orderId: newOrder._id, orderIndex: order.index });
        }
   
    } catch (err) {
        console.log('Error', err);
        res.status(404).json({ message: err.message });
    }
}

 

//************************UPDATE ORDERS********************** */



module.exports.setOrderTime = async (req, res, next) => {   
    try {
        const time = parseFloat(req.query.time);
        const orderId = (req.query.orderId);
        const order = await Order.findOneAndUpdate({ _id: orderId }, { completetime: time, pending: false }, { new: true });
        console.log(` Success! Order ${orderId} - the complete time was set to ${time} and pending to false!`)
        res.status(200).json({ message: 'time set' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}


module.exports.getOrderDone = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        const today = new Date().setUTCHours(0,0,0,0)
        const orders = await Order.find({locatie: loc, status: 'done', createdAt: {$gte: today}})
        res.json(orders)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.endPending = async (req, res, next) => {
    try{
        const {id} = req.query;
        const doc = await Order.findByIdAndUpdate(id, { pending: false })
        console.log(` Success! Order ${id} - pending - false`)
        res.status(200).json({message: 'pending is done'})
    } catch(err){
        console.log(err.message)
    }
}


module.exports.deleteOrder = async (req, res, next) => {
    try{
        const {data} = req.body;
        if(data && data.length) {
            for(let obj of data) {
                let order = await Order.findById(obj.id)
                await order.deleteOne()
            }
            res.status(200).json({messgae: 'Comenzile au fost sterse!'})
        }
    }catch(err) {   
        console.log(err)
        res.status(500).json({message: err.message})
    }   
}


