const Order = require('../../models/office/product/order');
const {Table} = require('../../models/utils/table')
const User = require ('../../models/users/user')
const DelProd = require('../../models/office/product/deletetProduct')
const Ingredient = require('../../models/office/inv-ingredient')
const Product = require('../../models/office/product/product')
const Counter = require('../../models/utils/counter')
const SalePoint = require('../../models/utils/sale-point')
const SubProduct = require('../../models/office/product/sub-product')

const {sendMailToCake, sendInfoAdminEmail, sendMailToCustomer} = require('../../utils/mail');
const {generateSoketId, formatedDateToShow} = require('../../utils/functions')

const {createProductSaleReport} = require('../../utils/inventary')
const {getIngredients, getBillProducts, createDayReport} = require('../../utils/reports')

const {unloadIngs, uploadIngs} = require('../../utils/inv/src/index')

const {createProductsReportXcelBuffer} = require('../print/products-reprot-xls')
const {createTotalsReportXcelBuffer} = require('../print/totals-report-xls')



const io = require('socket.io-client');
const socket = io('https://flowmanager.ro', {
      path: '/socket.io/',
      transports: ['websocket']
    })
// const socket = io("https://socket.flowmanager.ro")
const order = require('../../models/office/product/order');
const subProduct = require('../../models/office/product/sub-product');
// const socket = io("http://localhost:8090")



//************************SEND ORDERS********************** */

module.exports.getOrder = async (req, res, next) => {
    const {start, end, day, loc, point, download} = req.body

    try{
    const salePoint = await SalePoint.findById(point).populate({path: 'locatie'})

    if(start && end){
        const startTime = new Date(start).setUTCHours(0,0,0,0)
        const endTime = new Date(end).setUTCHours(23, 59, 59, 9999)

        const check = 32 * 24 * 60 * 60 * 1000

        if(start && end && (endTime - startTime > check)){
            return res.status(200).json({message: 'Sunt peste 31 de zile'})
        }

        const orders = await Order.find({locatie: loc, paymentDate: {$gte: startTime, $lte: endTime}, status: 'done', salePoint: point, invoice: false})
                        .populate({path: 'masaRest', select: 'name index'})
                        .populate({path: 'products.gestiune', select: 'name'})
                        .populate({path: 'products.departament', select: 'name'})
                        // .populate({path: 'products.productId', select: 'name departament'})
                        .populate({path: 'products.productId', select: 'name ings subProducts', populate: {path: 'subProducts', select: 'name ings'}}).lean()
                        .lean()
        const openOrders = await Order.find({ locatie: loc, status: 'open', salePoint: point})
                        .populate({path: 'masaRest', select: 'name index'})
                        .populate({path : 'products.gestiune', select: 'name'})
                        .populate({path : 'products.departament', select: 'name'}).lean()
                        // .populate({path: 'products.productId', select: 'departament'})
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, salePoint: point}).lean()
        await modifyOrdersProducts(orders)
        if(download && download.bool){
            const date = `${formatedDateToShow(start).split('ora')[0]} - ${formatedDateToShow(end).split('ora')[0]}`
            let buffer
            if(download.type === 'totals'){
               buffer = await createTotalsReportXcelBuffer(orders, salePoint, date)
            } else {
                return res.status(404).json({message: 'Nu a fost selectat un tip de download'})
            }

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');

            res.send(Buffer.from(buffer));
        } else {
            res.status(200).json({orders: [...orders, ...openOrders], delProducts: delProds, message: 'ok'})
        }
    }

    if(day && !end && !start) {
        const start = new Date(day).setUTCHours(0,0,0,0)
        const end = new Date(day).setUTCHours(23,59,59,9999)
        const orders = await Order.find({ locatie: loc , paymentDate: {$gte: start, $lt: end}, status: 'done', salePoint: point, invoice: false})
                    .populate({path: 'masaRest', select: 'name index'})
                    .populate({path : 'products.gestiune', select: 'name'})
                    .populate({path : 'products.departament', select: 'name'}).lean()
        const openOrders = await Order.find({ locatie: loc, status: 'open', salePoint: point}).lean()
                    .populate({path: 'masaRest', select: 'name index'})
                    .populate({path : 'products.gestiune', select: 'name'})
                    .populate({path : 'products.departament', select: 'name'}).lean()
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: start, $lt: end}, salePoint: point}).lean()
        // await modyfyOrdersProducts(orders)

        res.status(200).json({orders: [...orders, ...openOrders], delProducts: delProds,  message: 'ok'})
    }
    if(!day && !end && !start) {
        const today = new Date().setUTCHours(0,0,0,0)
        const orders = await Order.find({ locatie: loc , paymentDate: {$gte: today}, status: 'done', salePoint: point})
                        .populate({path: 'masaRest', select: 'name index'})
                        .populate({path : 'products.gestiune', select: 'name'})
                        .populate({path : 'products.departament', select: 'name'})
                        .populate({path: 'salePoint', select: 'name'})
                        .lean()
        const openOrders = await Order.find({ locatie: loc, status: 'open', salePoint: point})
                        .populate({path: 'masaRest', select: 'name index'})
                        .populate({path : 'products.gestiune', select: 'name'})
                        .populate({path : 'products.departament', select: 'name'}).lean()
        const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: today}, salePoint: point}).lean()
        res.status(200).json({orders: [...orders, ...openOrders], delProducts: delProds,  message: 'ok'})
    }

    } catch (err){
        console.log(err)
        res.status(500).json(err)
    }
}

// async function modifyOrdersProducts(orders) {
//     const updatePromises = [];
  
//     for (const o of orders) {
//       let shouldUpdate = false;
  
//       const updatedProducts = o.products.map(p => {
//         if (
//           p.productId &&
//           p.departament?._id?.toString() !==
//           p.productId?.departament?.toString()
//         ) {
//           console.log(
//             "Produs pe comanda cu departament diferit:",
//             p.name
//           );
  
//           shouldUpdate = true;
  
//           return {
//             ...p,
//             departament: {
//               ...p.departament,
//               _id: p.productId.departament
//             }
//           };
//         }
  
//         return p;
//       });
  
//       if (shouldUpdate) {
//         updatePromises.push(
//           Order.updateOne(
//             { _id: o._id },
//             { $set: { products: updatedProducts } }
//           )
//         );
//       }
//     }
  
//     await Promise.all(updatePromises);
  
//     console.log(
//       "Orders verified:", orders.length,
//       "→ Updated:", updatePromises.length
//     );
//   }
  


async function modifyOrdersProducts(orders) {
    const updatePromises = [];
  
    for (const o of orders) {
      let match = false;
  
      const updatedProducts = o.products.map(p => {
        if (
          p.productId && p.subProductId && !p.ings.length
        ) {
         console.log("gasit produs", p.name);
          const sub = p.productId.subProducts.find(
            s => s._id.toString() === p.subProductId
          );
  
          if (sub) {
            console.log("gasit subProdus", sub.name);
  
            match = true;
  
            return {
              ...p,
              ings: sub.ings
            };
          }
        }
  
        return p;
      });
  
      if (match) {
        updatePromises.push(
          Order.updateOne(
            { _id: o._id },
            { $set: { products: updatedProducts } }
          )
        );
      }
    }
  
    await Promise.all(updatePromises);
  
    console.log(
      "Orders verified:", orders.length,
      "→ Updated:", updatePromises.length
    );
  }
  
  

// async function modyfyOrdersProducts(orders){

//     let ordersToSave = []

//     for(let o of orders){
//         let pushOrder = false
//         for(p of o.products){
//             if(p.departament._id.toString() !== p.productId.departament.toString()){
//                 console.log('Produs Pe comanda cu departament diferit ', p.name)
//                 p.departament._id = p.productId.departament
//                 pushOrder = true
//             }
//         }
//         if(pushOrder){
//             ordersToSave.push(o)
//         }

//     }

//     const promises = ordersToSave.map(o => 
//          Order.findByIdAndUpdate(o._id, o, {new: true})
//     )

//     await Promise.all(promises)
//     console.log('orders verified:', orders.length, '→ Updated:', ordersToSave.length);

// }




module.exports.testRaport = async (req, res) => {
    try{
        const today = new Date(2025, 0, 1).setUTCHours(0,0,0,0)
        const end = new Date(2025, 0, 1).setUTCHours(0,0,0,0)
        const orders = await Order.find({ locatie: "655e2e7c5a3d53943c6b7c53" , paymentDate: {$gte: today}, status: 'done'})
        for(let order of orders){
            await createProductSaleReport(order.products, order.paymentDate)
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
        const {start, end, day, loc, filter, report, point, download} = req.body
        const salePoint = await SalePoint.findById(point).populate({path: 'locatie'})
        if(start && end){
            const startTime = new Date(start).setUTCHours(0,0,0,0)
            const endTime = new Date(end).setUTCHours(23,59,59,9999)
            const orders = await Order.find({locatie: loc, salePoint: point, paymentDate: {$gte: startTime, $lt: endTime}, status: "done", invoice: false})
                                    .populate({
                                        path: 'products.ings.ing',
                                        select: 'name price qty tva tvaPrice sellPrice um ings productIngredient uploadLog dept', 
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
                                        path: 'products.productId', select: 'gestiune departament',
                                        populate: [
                                            {
                                                path: 'departament', select: 'name'
                                            },
                                            {
                                                path: 'gestiune', select: 'name'
                                            }
                                        ]
                                    })
                                    .populate({path : 'products.gestiune', select: 'name'})
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
            const result = await getBillProducts(orders, filter)
            const ingredients = await getIngredients(result.allProd)
                
            if(download && download.bool){
                const date = `${formatedDateToShow(startTime).split('ora')[0]} - ${formatedDateToShow(endTime).split('ora')[0]}`
                console.log(date)
                let buffer
                if(download.type === 'products'){
                    buffer = await createProductsReportXcelBuffer(result.allProd, salePoint, date);
                } else if(download.type === 'orders'){

                } else if( download.type === 'totals'){

                } else {
                    return res.status(404).json({message: 'Nu a fost selectat un tip de download'})
                }
        
                // Set headers for file download
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');

                // Send the buffer directly
                res.send(Buffer.from(buffer));
            } else {
                if(report === 'report'){
                   const report = await createDayReport(result.allProd, ingredients, loc, orders, startTime, point)
                   res.status(200).json(report)
                } else {
                    res.status(200).json({result: result, ingredients: ingredients})
                }
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
        const orders = await Order.find({products: {$elemMatch: {category: '6842a447c028051a2632b451'}}, paymentDate: {$gte: startTime, $lt: endTime}, status: "done"})
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
        const orders = await Order.find({locatie: user.locatie, 'employee.user': userId, status: 'done', paymentDate: {$gte: start, $lt: end},  salePoint: point })
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
        const orders = await Order.find({locatie: loc, createdAt: {$gte: start, $lt: end} , salePoint: point}).populate({path: 'masaRest', select: 'index name' })
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
    const table = await Table.findById(parsedBill.masaRest)
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
            
            newBill.soketId = generateSoketId(16)
            const savedBill = await newBill.save();
            const ord = await Order.findById(savedBill._id).populate({path: 'masaRest', select: 'index name'})
            if(mode && mainServer) socket.emit('printOrder', JSON.stringify({bill: ord, serverKey: mainServer.key, secondaryServer: secondaryServer, mainServer: mainServer}))   
                
            savedBill.products.forEach(el => {
                if(el.sentToPrint){
                    el.sentToPrint = false
                    console.log("new",el.sentToPrint)
                }
            })
            
            table.bills.push(savedBill);
            await table.save();
            savedBill.masaRest = table
        
            const or = await Order.findByIdAndUpdate(savedBill._id, savedBill, {new: true}).populate({path: 'masaRest', select: 'index name'})
            socket.emit('billl', JSON.stringify({bill: or, secondaryServer: secondaryServer}))
            res.status(200).json({bill: or})

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
        const {ings, quantity, gestiune} = req.body;
        if(ings && quantity){
        await  uploadIngs(ings, quantity, gestiune)
        res.status(200).json({message: 'Success, stocul a fost actualizat!'})
        }else {
            res.status(404).json({message: 'Lipsa date'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.unloadIngs = async (req, res, next) => {
    try{
        const {ings, quantity, gestiune} = req.body;
        if(ings && quantity){
        await  unloadIngs(ings, quantity, gestiune)
        res.status(200).json({message: 'Success, stocul a fost actualizat!'})
        } else {
            res.status(404).json({message: 'Lipsa date'})
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
            let emails = [adminEmail]

        if (order.clientInfo.name !== 'Neînregistrat'){
            emails.push(order.clientInfo.email)
        }
        await sendMailToCustomer(order, emails)
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
        const orders = await Order.find({locatie: loc, status: 'done', paymentDate: {$gte: today}})
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
            if(m.section?.toString() === section){
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
            if(!m.section){
                console.log(m)
            } else {
                if(m.section.toString() === section){
                    m.prep = false
                    m.products.forEach(p => p.prep = 'done')
                }
            }
        }
        const newOrder = await Order.findByIdAndUpdate(order._id, order, {new: true}).populate({path: 'masaRest', select: 'index name'})
        socket.emit('billl', JSON.stringify({bill: newOrder, secondaryServer: server}))
        res.status(200).json({message: 'Comanda a fost marcată ca și terminată!', order: newOrder, server: server})
    } catch(err){
        console.log(err)
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

module.exports.deleteOrder = async (req, res) => {
    const  {id} = req.query
    try{
        await Order.findByIdAndDelete(id)
        res.status(200).json({message: 'Comanda a fost șteasă cu success!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}



module.exports.deleteOrders = async (req, res, next) => {
    try {
        const { data, tableId } = req.body;

        if (data && data.length) {
            const orderIds = data.map(obj => obj.id);

            // Find all orders that match the given socketIds
            const orders = await Order.find({ soketId: { $in: orderIds } });
            console.log('Found orders:', orders.length);

            if (orders.length) {
                const deletePromises = orders.map(order => {
                    if (!data.stopSend) {
                        setTimeout(() => {
                            socket.emit('tableBillId', JSON.stringify({ number: order.masa, id: order.soketId, orderId: order._id, tableId: tableId || ''}));
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

