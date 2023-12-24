const Order = require('../../models/office/product/order');
const Table = require('../../models/utils/table')
const User = require ('../../models/users/user')
const DelProd = require('../../models/office/product/deletetProduct')

const {sendMailToCake, sendInfoAdminEmail, sendMailToCustomer} = require('../../utils/mail');
const {formatedDateToShow, round} = require('../../utils/functions')

const {unloadIngs, uploadIngs} = require('../../utils/inventary')

const {print} = require('../../utils/printOrders')

//************************SEND ORDERS********************** */

module.exports.getOrder = async (req, res, next) => {
    try{
        const orders = await Order.find({})
       res.json(orders)
    } catch (err){
        console.log(err)
        
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
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        const {bill} = req.body;
        const parsedBill = JSON.parse(bill)
        const {index, billId} = req.query;
        if(billId === "new"){
            delete parsedBill._id
            delete parsedBill.index
            const table = await Table.findOne({index: index})
            const newBill = new Order(parsedBill);
            newBill.locatie = loc
            newBill.clientInfo = parsedBill.clientInfo
            if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
                newBill.user = parsedBill.clientInfo._id
            } 
            print(newBill)
            table.bills.push(newBill);
            const savedBill = await newBill.save();
            savedBill.products.forEach(el => {
                if(el.sentToPrint && el.ings.length || el.sentToPrint && el.toppings.length ){
                    if(el.toppings.length){
                        unloadIngs(el.toppings, loc, el.quantity);
                    }  else if(el.ings.length){
                        unloadIngs(el.ings, loc, el.quantity);
                    }
                    el.sentToPrint = false;
                } else if(el.sentToPrint){
                    el.sentToPrint = false
                }
            })
            await table.save();
            res.status(200).json({billId: savedBill._id, index: savedBill.index, products: savedBill.products, masa: {_id: table._id, index: table.index}})
        } else {
            print(parsedBill)
            parsedBill.products.forEach(el => {
                if(el.sentToPrint && el.ings.length || el.sentToPrint && el.toppings.length) {
                    if(el.toppings.length){
                        unloadIngs(el.toppings, loc, el.quantity);
                    } else if(el.ings.length){
                        unloadIngs(el.ings, loc, el.quantity);
                    }
                    el.sentToPrint = false;
                } else if(el.sentToPrint){
                    el.sentToPrint = false
                }
            })
            const bill = await Order.findByIdAndUpdate(billId, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index'});
            res.status(200).json({billId: bill._id, index: bill.index, products: bill.products, masa: bill.masaRest})
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
    await delProd.save()
    res.status(200).json({message: 'The product was registred as deleted!'})
}


module.exports.uploadIngs = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        const {ings, quantity} = req.body;
        if(ings && quantity){
            uploadIngs(ings, loc, quantity)
        res.status(200).json({message: 'Success, stocul a fost actualizat!'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}




module.exports.saveOrder = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try {
        const newOrder = new Order(req.body)
        newOrder.locatie =  loc;  
        const userId = req.body.user;
        const nrMasa = req.body.masa
        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                user.orders.push(newOrder);
                if (newOrder.cashBack > 0 && newOrder.cashBack <= user.cashBack) {
                    user.cashBack = round((user.cashBack - newOrder.cashBack) + (newOrder.total * 0.05))
                } else {
                    user.cashBack = round(user.cashBack + (newOrder.total * 0.05))
                }
                await user.save()
            }
            const order = await newOrder.save()
            console.log(`Order ${order._id} saved with the user ${user.name}!`)

            if(nrMasa > 0){
                const table = await Table.findOne({locatie:'655e2e7c5a3d53943c6b7c53', index: nrMasa});
                if(table){
                    table.bills.push(order._id)
                }
            }
            let action 
            if(order.payOnSite){
                action = `a dat o comanda pe care o plătește în locație cu cashBack ${order.cashBack}`
            } 
            if(order.payOnline){
                action = `a dat o comanda pe care a plătito online cu cashBack ${order.cashBack}`
            }
            if(order.preOrder) {
                action = `a dat o pre comanda  la cozonaci sau tarte`
                let cakeProducts = order.products.filter(product => product.name.startsWith('Cozonac'));
                let tartProducts = order.products.filter(product => product.name.startsWith('Orange')) ;
                let tartTotal = 0
                let cakeTotal = 0
                tartProducts.forEach(el => {
                    tartTotal += el.total
                })
                cakeProducts.forEach(el => {
                    cakeTotal += el.total
                })
                const startDate = formatedDateToShow(order.createdAt)
                const endDate = formatedDateToShow(order.preOrderPickUpDate)
                const cakeOrder = {
                    clientName: order.clientInfo.name,
                    clientEmail: user.email,
                    clientTelephone: order.clientInfo.telephone,
                    products: cakeProducts,
                    createdAt: startDate,
                    deliveryTime: endDate,
                    avans: cakeTotal,
                }
                const tartOrder = {
                    clientName: order.clientInfo.name,
                    clientEmail: user.email,
                    clientTelephone: order.clientInfo.telephone,
                    products: tartProducts,
                    createdAt: startDate,
                    deliveryTime: endDate,
                    avans: tartTotal,
                }
                if(cakeProducts.length){
                    sendMailToCake(cakeOrder, ['office@truefinecoffee.ro', 'buraga.stefan@l-artisan.ro'])
                }
    
                if(tartProducts.length){
                    sendMailToCake(tartOrder, ['office@truefinecoffee.ro', 'serbanlucianvornicu@gmail.com'])
                }
            }

            const startDate = formatedDateToShow(order.createdAt)
            order.name = startDate
            if(order.preOrder) {
                const endDate = formatedDateToShow(order.preOrderPickUpDate)
                    order.preOrderPickUpDate = endDate
            }
            console.log(order)
            await sendMailToCustomer(order,['alinz.spinu@gmail.com', `${user.email}`])
            res.status(200).json({ user: user, orderId: newOrder._id, orderIndex: order.index, preOrderPickUpDate: order.preOrderPickUpDate });
        } else {
            const order = await newOrder.save();
            console.log(`Order ${order._id} saved without a user!`)
            const data = {name: 'No user', action: 'a dat o comanda ce a fost platita Online'}
            await sendInfoAdminEmail(data)
            res.status(200).json({ message: 'Order Saved Without a user', orderId: newOrder._id, orderIndex: order.index });
        }
    } catch (err) {
        console.log('Error', err.message);
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
