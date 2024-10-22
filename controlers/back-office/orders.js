const Order = require('../../models/office/product/order');
const Table = require('../../models/utils/table')
const User = require ('../../models/users/user')
const DelProd = require('../../models/office/product/deletetProduct')
const Ingredient = require('../../models/office/inv-ingredient')
const Product = require('../../models/office/product/product')

const {sendMailToCake, sendInfoAdminEmail, sendMailToCustomer} = require('../../utils/mail');
const {generateSoketId} = require('../../utils/functions')

const {unloadIngs, uploadIngs} = require('../../utils/inventary')
const {getIngredients, getBillProducts, createDayReport} = require('../../utils/reports')

const {print} = require('../../utils/print/printOrders')
const {printBill, posPayment} = require('../../utils/print/printFiscal')

const io = require('socket.io-client')
const socket = io("https://live669-0bac3349fa62.herokuapp.com")
// const socket = io("http://localhost:8090")



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

module.exports.calcDep = async (req, res, next) => {
    const {start, end, loc} = req.query
    try{
    let ingIds = []
    let oldProd = []
    let totalIngs = 0
    if(start && end){
        const startTime = new Date(start).setHours(0,0,0,0)
        const endTime = new Date(end).setHours(23, 59, 59, 9999)
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep'})
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
            const product = await Product.findOne({name: prod.name}).select('ings').populate('ings.ing').select('tvaPrice')
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
        const {start, end, day, loc, filter, report} = req.body
        if(start && end){
            const startTime = new Date(start).setUTCHours(0,0,0,0)
            const endTime = new Date(end).setUTCHours(23,59,59,9999)
            // const startTime = new Date(convertToDateISOString(start)).setHours(0,0,0,0)
            // const endTime = new Date(convertToDateISOString(end)).setHours(23,59,59,9999)
            const orders = await Order.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, status: "done"})
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
                                        })                   
            const result = await getBillProducts(orders, filter)
            const ingredients = await getIngredients(result.allProd)
            if(report === 'report'){
               const report = await createDayReport(result.allProd, ingredients, loc, orders, startTime)
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
    const orders = await Order.find({locatie: user.locatie, 'employee.user': userId, status: 'done', createdAt: {$gte: start, $lt: end} })   
    res.status(200).json(orders)
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.getAllOrders = async (req, res, next) => {
    try{
        console.log('hit the function')
        const date = new Date()
        const start = new Date(date).setHours(0,0,0,0)
        const end = new Date(date).setHours(23, 59, 59, 999)
        const {loc} = req.query;
        const orders = await Order.find({locatie: loc, updatedAt: {$gte: start, $lt: end} }) 
        // const orders = await Order.find({
        //     locatie: loc,
        //     status: 'done',
        //     updatedAt: { $gte: start, $lt: end },
        //     'payment.cash': 0,
        //     'payment.online': 0
        // });

        // // If no orders found, return
        // console.log(orders.length)
        // if (orders.length === 0) {
        //     console.log('No matching orders found');
        //     return;
        // }

        // // Use Promise.all to perform updates for each order in parallel
        // await Promise.all(orders.map(order => {
        //     return Order.updateOne(
        //         { _id: order._id },  // Find by the _id of each order
        //         { $set: { 'payment.online': order.total } }  // Update the 'payment.online' field with 'total'
        //     );
        // }));
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
    const table = await Table.findOne({index: index, locatie: parsedBill.locatie})
    try{
        if(billId === "new"){
            delete parsedBill._id
            delete parsedBill.index
            const newBill = new Order(parsedBill);
            newBill.clientInfo = parsedBill.clientInfo
            if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
                newBill.user = parsedBill.clientInfo._id
            }
            // print(newBill)   
           socket.emit('printOrder', JSON.stringify(newBill))
            newBill.products.forEach(el => {
                if(el.sentToPrint){
                    el.sentToPrint = false
                }
            })
            newBill.soketId = generateSoketId(16)
            const savedBill = await newBill.save();
            table.bills.push(savedBill);
            await table.save();
            console.log('new ID', savedBill._id)
            socket.emit('billl', JSON.stringify(savedBill))
            res.status(200).json({ bill: savedBill})
        } else {
            socket.emit('printOrder', JSON.stringify(parsedBill))
            // print(parsedBill)
            console.log('HIT BEFORE SAVE NOTA DE LA MASA', parsedBill.masa)
            let productsToPrint = false   
            parsedBill.products.forEach(product => {
                if(product.sentToPrint){
                    productsToPrint = true
                    product.sentToPrint = false
                }
           })
           if(productsToPrint){
            console.log('second product',parsedBill.soketId)
                 socket.emit('billl', JSON.stringify(parsedBill))
                }
            // delete parsedBill._id
            const bill = await Order.findOneAndUpdate({soketId: parsedBill.soketId}, {products: parsedBill.products}, {new: true}).populate({path: 'masaRest', select: 'index'});
            if(bill){
                res.status(200).json({bill: bill})
            } else {
                console.log('HIT FIRST SAVE NOTA DE LA MASA', parsedBill.masa)
                delete parsedBill._id
                delete parsedBill.index
                const nBill = new Order(parsedBill)
                const newBill = await nBill.save()
                table.bills.push(newBill)
                await table.save()
                const billToSend = await Order.findById(newBill._id).populate({path: 'masaRest', select: 'index'})
                res.status(200).json({bill: billToSend})
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
    await delProd.save()
    res.status(200).json({message: 'The product was registred as deleted!'})
}



module.exports.uploadIngs = async (req, res, next) => {
    try{
        const {loc} = req.query
        const {ings, quantity, operation} = req.body;
        if(ings && quantity){
        uploadIngs(ings, quantity, operation)
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
        console.log(req.body)
        if(ings && quantity){
        unloadIngs(ings, quantity, operation)
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
        if (order.user !== 'john doe') {
            const newOrder = new Order(order) 
            const user = await User.findById(order.user);
            if (user) {
                newOrder.clientInfo.email = user.email
                newOrder.clientInfo.discount = user.discount
                newOrder.clientInfo.cashBack = user.cashBack
                newOrder.preOrder = true
                const savedOrder = await newOrder.save()
                const dbOrder = await Order.findById(savedOrder._id).populate({path: 'locatie'})
                console.log(`Order ${dbOrder._id} saved with the user ${user.name}!`)
                let action 
                if(order.payOnSite){
                    action = `a dat o comanda pe care o plătește în locație cu cashBack ${order.cashBack}`
                } 
                if(order.payOnline){
                    action = `a dat o comanda pe care a plătito online cu cashBack ${order.cashBack}`
                }
                socket.emit('orderId', JSON.stringify(savedOrder))
                sendMailToCustomer(dbOrder,[`${adminEmail}`, `${user.email}`])
                res.status(200).json({ user: user, orderId: savedOrder._id, orderIndex: savedOrder.index, preOrderPickUpDate: savedOrder.preOrderPickUpDate });
            }
        } else {
            order.preOrder = true
            delete order.user
            const newOrder = new Order(order) 
            const savedOrder = await newOrder.save();
            socket.emit('orderId', JSON.stringify(savedOrder))
            const dbOrder = await Order.findById(savedOrder._id).populate({path: 'locatie'})
            console.log(`Order ${dbOrder._id} saved without a user!`)
            const data = {name: 'No user', action: 'a dat o comanda ce a fost platita Online'}
            sendInfoAdminEmail(data, adminEmail, dbOrder.locatie.gmail)
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
    try {
        const { data } = req.body;
        console.log('data', data);

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

// module.exports.deleteOrder = async (req, res, next) => {
//     try{
//         const {data} = req.body;
//         console.log('data', data)
//         if(data && data.length) {
//             for(let obj of data) {
//                 const order = await Order.findOne({soketId: obj.id})
//                 console.log('order')
//                 if(order){
//                     if(!data.stopSend){
//                         setTimeout(() => {
//                             socket.emit('tableBillId', JSON.stringify({number: order.masa, id: order.soketId}))
//                         }, 500)
//                     }
//                     await order.deleteOne()
//                 }
//             }
//             res.status(200).json({messgae: 'Comenzile au fost sterse!'})
//         }
//     }catch(err) {   
//         console.log(err)
//         res.status(500).json({message: err.message})
//     }   
// }





// module.exports.saveOrEditBill = async (req, res, next) => {
//     const {bill} = req.body;
//     const parsedBill = JSON.parse(bill)
//     const {index, billId} = req.query;
//     try{
//         if(billId === "new"){
//             delete parsedBill._id
//             delete parsedBill.index
//             const table = await Table.findOne({index: index, locatie: parsedBill.locatie})
//             const newBill = new Order(parsedBill);
//             newBill.clientInfo = parsedBill.clientInfo
//             if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
//                 newBill.user = parsedBill.clientInfo._id
//             }         
//             newBill.products.forEach(el => {
//                 if(el.sentToPrint){
//                     el.sentToPrint = false
//                     console.log("new",el.sentToPrint)
//                 }
//             })
//             const savedBill = await newBill.save();
//             table.bills.push(savedBill);
//             await table.save();
//             socket.emit('bill', JSON.stringify(savedBill))
//             res.status(200).json({billId: savedBill._id, index: savedBill.index, products: savedBill.products, billTotal: savedBill.total,  masa: {_id: table._id, index: table.index}})
//         } else {
//             parsedBill.products.forEach(el => {
//                 if(el.sentToPrint){
//                     el.sentToPrint = false
//                     console.log("old",el.sentToPrint)
//                 }
//             })
//             const savedBill = await Order.findByIdAndUpdate(billId, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index'});
//             socket.emit('bill', JSON.stringify(bill))
//             res.status(200).json({billId: parsedBill._id, index: parsedBill.index, billTotal: parsedBill.total, products: parsedBill.products, masa: parsedBill.masaRest})
//         }
//     } catch(err){
//         console.log(err)
//         res.status(500).json({message: 'Something went wrong', err: err.message})
//     }
// }


// module.exports.saveOrEditBill = async (req, res, next) => {
//     const {bill} = req.body;
//     const parsedBill = JSON.parse(bill)
//     const {index, billId} = req.query;
//     try{
//         if(billId === "new"){
//             delete parsedBill._id
//             delete parsedBill.index
//             const table = await Table.findOne({index: index, locatie: parsedBill.locatie})
//             const newBill = new Order(parsedBill);
//             newBill.clientInfo = parsedBill.clientInfo
//             if(parsedBill.clientInfo._id && parsedBill.clientInfo._id.length){
//                 newBill.user = parsedBill.clientInfo._id
//             } 
//             print(newBill)
//             newBill.products.forEach(el => {
//                 if(el.sentToPrint && el.ings.length || el.sentToPrint && el.toppings.length ){
//                     if(el.toppings.length){
//                         unloadIngs(el.toppings, el.quantity, {name:'vanzare', details: el.name});
//                     } 
//                     if(el.ings.length){
//                         unloadIngs(el.ings, el.quantity, {name:'vanzare', details: el.name});
//                     }
//                     el.sentToPrint = false;
//                     console.log("new", el.sentToPrint)
//                 } else if(el.sentToPrint){
//                     el.sentToPrint = false
//                     console.log("new",el.sentToPrint)
//                 }
//             })
//             const savedBill = await newBill.save();
          
//             table.bills.push(savedBill);
//             setTimeout(() => {
//                 socket.emit('bill', JSON.stringify(savedBill))
//             }, 1000)
//             await table.save();
//             res.status(200).json({billId: savedBill._id, index: savedBill.index, products: savedBill.products, billTotal: savedBill.total, masa: {_id: table._id, index: table.index}})
//         } else {
//             print(parsedBill)
//             parsedBill.products.forEach(el => {
//               if(el.sentToPrint){
//                     el.sentToPrint = false
//                     console.log("old",el.sentToPrint)
//                 }
//             })
//             async function saveBill() {
//                 const order = await Order.findById(billId)
//                 if(order.status === "done"){
//                     parsedBill.status = 'done'
//                     parsedBill.payment = order.payment
//                     parsedBill.pending = order.pending
//                     const bill = await Order.findByIdAndUpdate(billId, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index'});
//                     socket.emit('bill', JSON.stringify(bill))
//                     res.status(200).json({billId: bill._id, index: bill.index, billTotal: bill.total, products: bill.products, masa: bill.masaRest})
//                 } else {
//                     const bill = await Order.findByIdAndUpdate(billId, parsedBill, {new: true}).populate({path: 'masaRest', select: 'index'});
//                     socket.emit('bill', JSON.stringify(bill))
//                     res.status(200).json({billId: bill._id, index: bill.index, billTotal: bill.total, products: bill.products, masa: bill.masaRest})
//                 }
//             }
//             setTimeout(saveBill, 1000)
//         }
//     } catch(err){
//         console.log(err)
//         res.status(500).json({message: 'Something went wrong', err: err.message})
//     }
// }

