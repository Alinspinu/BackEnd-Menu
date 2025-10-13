const Order = require('../../models/office/product/order');
const Table = require('../../models/utils/table')
const User = require ('../../models/users/user')
const DelProd = require('../../models/office/product/deletetProduct')
const Ingredient = require('../../models/office/inv-ingredient')
const Product = require('../../models/office/product/product')
const Counter = require('../../models/utils/counter')

const {sendMailToCake, sendInfoAdminEmail, sendMailToCustomer} = require('../../utils/mail');
const {generateSoketId} = require('../../utils/functions')

const {unloadIngs, uploadIngs, createProductSaleReport} = require('../../utils/inventary')
const {getIngredients, getBillProducts, createDayReport} = require('../../utils/reports')



const io = require('socket.io-client');
const socket = io("https://socket.flowmanager.ro")
const salePoint = require('../../models/utils/sale-point');
// const socket = io("http://localhost:8090")



//************************SEND ORDERS********************** */

module.exports.getOrder = async (req, res, next) => {
    const {start, end, day, loc, point} = req.body
    if(start && end){
        const startTime = new Date(start).setUTCHours(0,0,0,0)
        const endTime = new Date(end).setUTCHours(23, 59, 59, 9999)
        const orders = await Order.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, status: 'done', salePoint: point}).populate({path: 'masaRest', select: 'name index'})
            .populate({path: 'products.ings.ing', select: 'invGestiune'})
        const openOrders = await Order.find({ locatie: loc, status: 'open', salePoint: point}).populate({path: 'masaRest', select: 'name index'})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, salePoint: point})
        await updateDelProducts(orders)
        res.status(200).json({orders: [...orders, ...openOrders], delProducts: delProds})
    }

    if(day && !end && !start) {
        const start = new Date(day).setUTCHours(0,0,0,0)
        const end = new Date(day).setUTCHours(23,59,59,9999)
        const orders = await Order.find({ locatie: loc , createdAt: {$gte: start, $lt: end}, status: 'done', salePoint: point}).populate({path: 'masaRest', select: 'name index'})
        const openOrders = await Order.find({ locatie: loc, status: 'open', salePoint: point}).populate({path: 'masaRest', select: 'name index'})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: start, $lt: end}, salePoint: point})
        console.log(delProds)
        res.status(200).json({orders: [...orders, ...openOrders], delProducts: delProds})
    }
    if(!day && !end && !start) {
        const today = new Date().setUTCHours(0,0,0,0)
        const orders = await Order.find({ locatie: loc , createdAt: {$gte: today}, status: 'done', salePoint: point}).populate({path: 'masaRest', select: 'name index'})
        const openOrders = await Order.find({ locatie: loc, status: 'open', salePoint: point}).populate({path: 'masaRest', select: 'name index'})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: today}, salePoint: point})
        console.log(orders.length)
        res.status(200).json({orders: [...orders, ...openOrders], delProducts: delProds})
    }
    try{
    } catch (err){
        console.log(err)
    }
}

async function updateDelProducts(orders){

    // for(let o of orders){
    //     for(let p of o.products){
    //         for(let i of p.ings){
    //             if(!i.gestiune){
    //                 console.log('produs gasit cu ingredient fara gestiune ', p.name)
    //                 i.gestiune =  i.ing.invGestiune[0].gestiune
    //                 console.log('i-am adaugat gestiune ', i.gestiune)
    //             }
    //         }
    //         for(let t of p.toppings){
    //             if(!t.gestiune){
                 
    //                 t.gestiune =  t.ing.invGestiune[0].gestiune
    //                 console.log('i-am adaugat gestiune ', t.gestiune)
    //             }
    //         }
    //     }
    // }


    const promises = orders.map(o => {
        for(let p of o.products){
            for(let i of p.ings){
                if(!i.gestiune){
                    console.log('produs gasit cu ing fara gestiune ', p.name)
                    i.gestiune = i.ing.invGestiune[0].gestiune
                    console.log('i-am adaugat gestiune ', i.gestiune)
                }
            }
            for(let t of p.toppings){
                if(!t.gestiune){
                    t.gestiune = t.ing.invGestiune[0].gestiune
                }
            }
            
        }
        return o.save()
    })

     await Promise.all(promises);

}


module.exports.testRaport = async (req, res) => {
    try{
        const today = new Date(2025, 0, 1).setUTCHours(0,0,0,0)
        const end = new Date(2025, 0, 1).setUTCHours(0,0,0,0)
        const orders = await Order.find({ locatie: "655e2e7c5a3d53943c6b7c53" , createdAt: {$gte: today}, status: 'done'})
        for(let order of orders){
            await createProductSaleReport(order.products, order.createdAt)
         }
         res.status(200).json({message: 'All good in the hood'})

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getClientOrders = async (req, res) => {
    const {userId} = req.query
    try{
        const orders = await Order.find({user: userId})
        res.status(200).json(orders)
    } catch(error){
        res.status(500).json(error)
        console.log(error)
    }
}



module.exports.calcDep = async (req, res, next) => {
    const {start, end, loc, point} = req.query
    try{
    let ingIds = []
    let oldProd = []
    let totalIngs = 0
    if(start && end){
        const startTime = new Date(start).setHours(0,0,0,0)
        const endTime = new Date(end).setHours(23, 59, 59, 9999)
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep',  salePoint: point})
        for(const prod of delProds){
            for(const ing of prod.billProduct.ings){
                if(ing.ing){
                    const existingIng = ingIds.find(obj => obj._id === ing._id)
                    if(existingIng){
                        existingIng.qty += ing.qty
                    } else {
                        ingIds.push(ing)
                    }
                } else {
                    const existingProd = oldProd.find(obj => obj.name === prod.billProduct.name)
                    if(existingProd){
                        existingProd.qty += 1
                    } else {
                        oldProd.push({
                            name: prod.billProduct.name,
                            qty: 1
                        })
                    }
                    break
                }
            }
        }
        for (let i = 0; i < ingIds.length; i++) {
            const ing = ingIds[i];
                const dbIng = await Ingredient.findById(ing.ing).select('tvaPrice')
                totalIngs += (ing.qty * dbIng.tvaPrice)
          }
        for(const prod of oldProd){
            const product = await Product.findOne({name: prod.name , salePoint: point}).select('ings').populate('ings.ing').select('tvaPrice')
            if(product){
                for(const ing of product.ings){
                    totalIngs += (ing.qty * ing.ing.tvaPrice * prod.qty)
                }
            }
        }
        res.status(200).json(totalIngs)
    }
    } catch (err){
        console.log(err)
    }
}




  


module.exports.getHavyOrders = async (req, res, next) => {
    try{
        const {start, end, day, loc, filter, report, point} = req.body
        if(start && end){
            const startTime = new Date(start).setUTCHours(0,0,0,0)
            const endTime = new Date(end).setUTCHours(23,59,59,9999)
            const orders = await Order.find({locatie: loc, salePoint: point, createdAt: {$gte: startTime, $lt: endTime}, status: "done"})
                                    .populate({
                                        path: 'products.ings.ing',
                                        select: 'name price qty tva tvaPrice sellPrice um ings productIngredient uploadLog', 
                                        populate: {
                                            path: 'ings.ing', 
                                            select: 'name price qty tva tvaPrice sellPrice um productIngredient ings uploadLog', 
                                            populate: { 
                                                path:'ings.ing',
                                                select: "name price qty tva tvaPrice sellPrice um productIngredient ings uploadLog"
                                            }
                                        }
                                    })
                                    .populate({
                                        path: 'products.toppings.ing', 
                                        select: 'name price qty tva tvaPrice sellPrice um ings productIngredient uploadLog', 
                                        populate: {
                                            path: 'ings.ing',
                                             select: 'name price qty tva tvaPrice sellPrice um productIngredient ings uploadLog',
                                             populate: {
                                                path: 'ings.ing',
                                                select: "name price qty tva tvaPrice sellPrice um productIngredient ings uploadLog", 
                                                }
                                            }
                                        }).lean({virtuals: false})    
             console.log('comenzi', orders.length)                                   
            const result = await getBillProducts(orders, filter)
            const ingredients = await getIngredients(result.allProd)
            if(report === 'report'){
               const report = await createDayReport(result.allProd, ingredients, loc, orders, startTime, point)
               res.status(200).json(report)
            } else {
                res.status(200).json({result: result, ingredients: ingredients})
            }
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}


module.exports.getIceCreamOrders = async (req, res) => {
    const {start, end} = req.body
    if(start && end){
        const startTime = new Date(start).setUTCHours(0,0,0,0)
        const endTime = new Date(end).setUTCHours(23,59,59,9999)
    try{
        const orders = await Order.find({products: {$elemMatch: {category: '6842a447c028051a2632b451'}}, createdAt: {$gte: startTime, $lt: endTime}, status: "done"})
        .populate({
            path: 'products.ings.ing',
            select: 'name price uploadLog', 
        })
        .populate({
            path: 'products.toppings.ing', 
            select: 'name price qty tva tvaPrice um uploadLog', 
            })  
          res.status(200).json(orders)  
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}
}



module.exports.sendDeletedproduct = async (req, res, next) => {
    try{
        const delProds = DelProd.find({})
        res.status(200).json(delProds)
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }

}

module.exports.getOrderByUser = async (req, res, nex) => {
        const {userId, point} = req.query;
    try{
        const date = new Date()
        const start = new Date(date).setHours(0,0,0,0)
        const end = new Date(date).setHours(23, 59, 59, 999)
        const user = await User.findById(userId)
        const orders = await Order.find({locatie: user.locatie, 'employee.user': userId, status: 'done', createdAt: {$gte: start, $lt: end},  salePoint: point })
        res.status(200).json(orders)
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.getAllOrders = async (req, res, next) => {
        const {loc, point} = req.query;
    try{
        const date = new Date()
        const start = new Date(date).setHours(0,0,0,0)
        const end = new Date(date).setHours(23, 59, 59, 999)
        const orders = await Order.find({locatie: loc, updatedAt: {$gte: start, $lt: end} , salePoint: point}).populate({path: 'masaRest', select: 'index name' })
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
    const {bill, mode, mainServer, secondaryServer} = req.body;
    const parsedBill = JSON.parse(bill)
    const {index, billId} = req.query;
    const table = await Table.findOne({index: index, locatie: parsedBill.locatie, salePoint: parsedBill.salePoint})
    try{
        if(billId === "new"){
            delete parsedBill._id
            delete parsedBill.index
            const newBill = new Order(parsedBill);
            newBill.clientInfo = parsedBill.clientInfo
            if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
                newBill.user = parsedBill.clientInfo._id
                newBill.clientInfo.userId = newBill.user
            }
            if(mode && mainServer) socket.emit('printOrder', JSON.stringify({bill: newBill, serverKey: mainServer.key, secondaryServer: secondaryServer, mainServer: mainServer}))   

            newBill.products.forEach(el => {
                if(el.sentToPrint){
                    el.sentToPrint = false
                    console.log("new",el.sentToPrint)
                }
            })
            newBill.soketId = generateSoketId(16)
            const savedBill = await newBill.save();
            table.bills.push(savedBill);
            await table.save();
            savedBill.masaRest = table
            socket.emit('billl', JSON.stringify({bill: savedBill, secondaryServer: secondaryServer}))
            res.status(200).json({bill: savedBill})

        } else {

           if(mode && mainServer) socket.emit('printOrder', JSON.stringify({bill: parsedBill, serverKey: mainServer.key, secondaryServer: secondaryServer, mainServer: mainServer}))  
            let productsToPrint = false
            parsedBill.products.forEach(el => {
                if(el.sentToPrint){
                    productsToPrint = true
                    el.sentToPrint = false
                }
            })
            if(productsToPrint){
                socket.emit('billl', JSON.stringify({bill: parsedBill, secondaryServer: secondaryServer}))
            }
            delete parsedBill._id
            if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
                parsedBill.user = parsedBill.clientInfo._id
                parsedBill.clientInfo.userId = parsedBill.user
            }
            const bill = await Order.findOneAndUpdate({soketId: parsedBill.soketId}, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index name'});
            if(bill){
                res.status(200).json({bill: bill})
            } else {
                res.status(200).json({message: "NASOL"})
            }
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
    const savedProd = await delProd.save()
    socket.emit('delProduct', JSON.stringify(savedProd))
    res.status(200).json({message: 'The product was registred as deleted!'})
}



module.exports.uploadIngs = async (req, res, next) => {
    try{
        const {loc} = req.query
        const {ings, quantity, operation} = req.body;
        if(ings && quantity){
        await  uploadIngs(ings, quantity, operation)
        res.status(200).json({message: 'Success, stocul a fost actualizat!'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.unloadIngs = async (req, res, next) => {
    try{
        const {ings, quantity, operation} = req.body;
        if(ings && quantity){
        await  unloadIngs(ings, quantity, operation)
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
        order.soketId = generateSoketId(16)
        const table = await Table.findOne({locatie: order.locatie, salePoint: order.salePoint, name: 'Comenzi Online'});
        table ? order.masa = table.index : null
        table ? order.masaRest = table._id : null
        delete order._id
        delete order.employee
        if (order.clientInfo.name !== 'Neînregistrat') {
            const newOrder = new Order(order) 
            const user = await User.findById(order.clientInfo.userId);
            if (user) {
                newOrder.clientInfo.email = user.email
                newOrder.clientInfo.discount = user.discount
                newOrder.clientInfo.cashBack = user.cashBack
                newOrder.user = user._id
                newOrder.preOrder = true
                const savedOrder = await newOrder.save()        
                if(table){
                    table.bills.push(savedOrder._id)
                    await table.save()
                }
                socket.emit('orderId', JSON.stringify(savedOrder))
                res.status(200).json({ user: user, orderId: savedOrder._id, orderIndex: savedOrder.index, preOrderPickUpDate: savedOrder.preOrderPickUpDate, order: savedOrder });
            } else {
                res.status(400).json({message: 'FARA USER'})
            }
        } else {
            order.preOrder = true
            delete order.user
            const newOrder = new Order(order) 
            const savedOrder = await newOrder.save();
            socket.emit('orderId', JSON.stringify(savedOrder))
            const dbOrder = await Order.findById(savedOrder._id).populate({path: 'locatie'})
            if(table){
                table.bills.push(savedOrder._id)
                await table.save()
            }
            res.status(200).json({ message: 'Order Saved Without a user', orderId: newOrder._id, orderIndex: order.index });
        }
   
    } catch (err) {
        console.log('Error', err);
        res.status(404).json({ message: err.message });
    }
}


//************************UPDATE ORDERS********************** */


module.exports.changeBillTable = async (req, res) => {
    const {orderId, tableIndex} = req.body
    try{

        const dbOrder = await Order.findById(orderId)
        if(dbOrder){
            const oldTable = await Table.findByIdAndUpdate(dbOrder.masaRest, {$pull: {bills: dbOrder._id}}, {new: true})
            const newTable = await Table.findOneAndUpdate({index: tableIndex, locatie: dbOrder.locatie, salePoint: dbOrder.salePoint}, {$push:{bills: dbOrder._id}}, {new: true})
            dbOrder.masaRest = newTable._id;
            dbOrder.masa = tableIndex
            const savedOrder = await dbOrder.save()
            res.status(200).json({order: savedOrder, oldT: oldTable, newT: newTable, message: "Comanda a afost mutată!"})
        } else {
            res.status(200).json({message: 'Comanda nu a fost găsită!'})
        }

    } catch(error) {
        res.status(500).json(error)
        console.log(error)
    }
}



module.exports.setOrderTime = async (req, res, next) => {   
        const time = parseFloat(req.query.time);
        const orderId = req.query.orderId;
        
        try {
            const order = await Order.findOneAndUpdate({ _id: orderId }, { completetime: time, pending: false }, { new: true })
                    .populate({path: 'locatie'})
                    .populate({path: 'salePoint'});

            const adminEmail = order.locatie.name === 'T ZERO' ? 'office@t-zero.ro' : `office@truefinecoffee.ro`

        if (order.clientInfo.name !== 'Neînregistrat'){
            sendMailToCustomer(order, [adminEmail, `${order.clientInfo.email}`])
        }
        socket.emit('orderTime', JSON.stringify({id: order._id, time: order.completetime, masa: order.masa, toGo: order.toGo}))
        console.log(` Success! Order ${orderId} - the complete time was set to ${time} and pending to false!`)
        res.status(200).json({ message: 'time set', order: order });
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


const server = {
    key: "6fe642"
}

module.exports.endPending = async (req, res, next) => {
    try{
        const {id, section} = req.body;
        if(!id){
            return res.status(404).json({message: 'No id was found'})
        }
        const order = await Order.findById(id)
        if(!order){
            return res.status(404).json({message: 'No order was found'})
        }
        for(let m of order.monitors){
            if(m.section && m.section.toString() === section){
                m.pending = false
                m.products.forEach(p => {
                    if(p.prep === 'pending'){
                        p.prep = 'accepted'
                    }
                }) 
            }
        }
        const newOrder = await Order.findByIdAndUpdate(order._id, order, {new: true}).populate({path: 'masaRest', select: 'index name'})
        socket.emit('billl', JSON.stringify({bill: newOrder, dontParse: true}))
        res.status(200).json({message: 'Comanda a fost acceptată!', order: newOrder, server: server})
    } catch(err){
        console.log(err.message)
        res.status(500).json(err)
    }
}

module.exports.liftStatusDone = async (req, res, next) => {
    try{
        const {id, section} = req.query;
        if(!id){
            return res.status(404).json({message: 'No id was found'})
        }
        const order = await Order.findById(id)
        if(!order){
            return res.status(404).json({message: 'No order was found'})
        }
        for(let m of order.monitors){
            if(m.section.toString() === section){
                m.lifted = true 
            }
        }
        const newOrder = await Order.findByIdAndUpdate(order._id, order, {new: true}).populate({path: 'masaRest', select: 'index name'})
        socket.emit('billl', JSON.stringify({bill: newOrder, secondaryServer: server}))
        res.status(200).json({message: 'Comanda a fost marcată ca și ridicată!', order: newOrder, server: server})
    } catch(err){
        console.log(err.message)
        res.status(500).json(err)
    }
}


module.exports.prepStatusDone = async (req, res, next) => {
    try{
        const {id, section} = req.body;
        if(!id){
            return res.status(404).json({message: 'No id was found'})
        }
        const order = await Order.findById(id)
        if(!order){
            return res.status(404).json({message: 'No order was found'})
        }
        
        for(let m of order.monitors){
            if(m.section.toString() === section){
                m.prep = false
                m.products.forEach(p => p.prep = 'done')
            }
        }
        const newOrder = await Order.findByIdAndUpdate(order._id, order, {new: true}).populate({path: 'masaRest', select: 'index name'})
        socket.emit('billl', JSON.stringify({bill: newOrder, secondaryServer: server}))
        res.status(200).json({message: 'Comanda a fost marcată ca și terminată!', order: newOrder, server: server})
    } catch(err){
        console.log(err.message)
        res.status(500).json(err)
    }
}

module.exports.resetOrderCounter = async (req, res) => {
    const {point, loc} = req.query
    try{
        await Counter.findOneAndUpdate({locatie: loc, salePoint: point, model: 'DayOrder'}, {$set: {value: 0}})
        res.status(200).json({message: 'Numarul de ordine a fost resetat!'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}





module.exports.deleteOrder = async (req, res, next) => {
    try {
        const { data } = req.body;

        if (data && data.length) {
            const orderIds = data.map(obj => obj.id);

            // Find all orders that match the given socketIds
            const orders = await Order.find({ soketId: { $in: orderIds } });
            console.log('Found orders:', orders.length);

            if (orders.length) {
                const deletePromises = orders.map(order => {
                    if (!data.stopSend) {
                        setTimeout(() => {
                            socket.emit('tableBillId', JSON.stringify({ number: order.masa, id: order.soketId }));
                        }, 500);
                    }

                    // Return the deletion promise
                    return order.deleteOne()
                        .then(() => console.log(`Order with socketId ${order.soketId} deleted.`))
                        .catch(err => console.error(`Failed to delete order with socketId ${order.soketId}:`, err));
                });

                // Wait for all delete operations to complete
                await Promise.all(deletePromises);
                res.status(200).json({ message: 'Comenzile au fost sterse!' });
            } else {
                res.status(404).json({ message: 'No orders found to delete.' });
            }
        } else {
            res.status(400).json({ message: 'Invalid data provided.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

