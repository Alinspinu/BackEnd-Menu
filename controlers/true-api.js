if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const Product = require('../models/product/product-true')
const SubProduct = require('../models/product/sub-product')
const Category = require('../models/product/cat-true')
const Cat = require('../models/product/cat-true')
const User = require('../models/user-true')
const Order = require('../models/product/order-true')
const Table = require('../models/utils/table')
const BlackList = require('../models/product/blacList')
const Bill = require('../models/product/order-true')
const { cloudinary } = require('../cloudinary');
const blacList = require('../models/product/blacList');
const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');



// ************SEND DATA TO THE APP***************

module.exports.sendTables = async (req, res, next) => {
    try{
        const tables = await Table.find({}).populate({
            path: 'bills', 
            model: "OrderTrue", 
            match: {status: 'open'}, 
            populate: {path: 'masaRest', select: 'index'}})
        res.status(200).json(tables)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}


module.exports.sendCats = async (req, res, next) => {
    try {
        const { mainCat } = req.query;
        const cats = await Cat.find().populate({
            path: 'product',
            populate: [
                { path: 'category' },
                {
                    path: 'subProducts',
                    populate: {
                        path: 'product',
                    }
                },
                { path: 'paring', populate: { path: 'category', select: 'name' } },
                { path: 'ingredients.ingredient' }
            ]
        }).maxTimeMS(20000);
        res.status(200).json(cats);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.message })
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

module.exports.sendBlackList = async (req, res, next) => {
    const blackList = await BlackList.findOne({name: 'True'});
    if(blackList){
        res.status(200).json(blackList.list)
    } else {
        console.log('Something went wrong!')
        res.status(404).json({message: 'Black list not found'})
    }
}

// **********************SAVE DATA*************************



module.exports.saveOrEditBill = async (req, res, next) => {
    try{
        const {bill} = req.body;
        const parsedBill = JSON.parse(bill)
        const {index, billId} = req.query;
        if(billId === "new"){
            delete parsedBill._id
            delete parsedBill.index
            const table = await Table.findOne({index: index})
            const bill = new Bill(parsedBill);
            table.bills.push(bill);
            const savedBill = await bill.save();
            await table.save();
            console.log(savedBill)
            console.log(table)
            res.status(200).json({billId: savedBill._id, index: savedBill.index})
        } else {
            const bill = await Bill.findByIdAndUpdate(billId, parsedBill, {new: true});
            res.status(200).json({billId: bill._id, index: bill.index})
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: 'Something went wrong', err})
    }
    
}



module.exports.addToBlackList = async (req, res, next) => {
    try{
        if(req.body.length){
            const blackList = await BlackList.findOneAndUpdate(
                {name: 'True'}, 
                {$set: {list: req.body}},  
                { new: true, useFindAndModify: false })
                res.status(200).json({message: "Black list updated", list: blackList.list})
        } else {
            const blackList = await BlackList.findOneAndUpdate(
                {name: 'True'}, 
                {$set: {list: []}},  
                { new: true, useFindAndModify: false })
                res.status(200).json({message: "Black list cleared", list: blackList.list})
        }
    }catch (err) {
        console.log('Error', err);
        res.status(500).json({message: err})
    }   
}

module.exports.addTopping = async (req, res, next) => {
    try{
        const {id} = req.query;
        const newProduct = await Product.findOneAndUpdate({_id: id}, {$push: {toppings: req.body}}, {new: true, useFindAndModify: false}).populate({path: 'category', select: 'name'})
        res.status(200).json(newProduct)
    } catch (err){
        console.log("Error", err)
        res.status(500).json({message: err})
    }
    
}

module.exports.saveSubProd = async (req, res, next) => {
    try {
        const {product, name, price, order, qty, ings, toppings} = req.body;
        const productSub = await Product.findById(product);
        const newSubProduct = new SubProduct({
            name: name,
            price: price,
            product: product,
            order: parseFloat(order),
            qty: qty,
            ings: ings,
            toppings: toppings
        });
        productSub.subProducts.push(newSubProduct);
        await newSubProduct.save();
        await productSub.save();
        const subToSend = await SubProduct.findById(newSubProduct._id).populate({ path: 'product', select: 'category' });
        res.status(200).json({ message: `${name}, was saved in ${productSub.name}`, subProduct: subToSend })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.error.message });
    };
};

module.exports.addCat = async (req, res, next) => {
    try {
        const cat = new Cat(req.body)
        if (req.file) {
            const { path, filename } = req.file
            cat.image.filename = filename
            cat.image.path = path
        }
        await cat.save()
        const catToSend = await Category.findById(cat._id)
        res.status(200).json({ message: `Category ${cat.name} was created!`, cat: catToSend })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.message })
    }
}


module.exports.addProd = async (req, res, next) => {
    try {
        const { category } = req.body;
        const cat = await Cat.findById(category);
        const product = new Product(req.body);
        product.order = parseFloat(req.body.order);
        product.price = parseFloat(req.body.price);
        if(req.query.length){
            product.ings = JSON.parse(req.query.ings)
            product.toppings = JSON.parse(req.query.toppings)
        }
        if (req.file) {
            const { path, filename } = req.file;
            product.image.filename = filename;
            product.image.path = path;
        }
        cat.product.push(product);
        await product.save();
        await cat.save();
        const productToSend = await Product.findById(product._id);
        res.status(200).json({ message: `Product ${product.name} was created!`, product: productToSend });
    } catch (err) {
        console.log(err);
        res.status(500).json({ err });
    }
}



module.exports.saveOrder = async (req, res, next) => {
    try {
        const newOrder = new Order(req.body)
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
                const table = await Table.findOne({index: nrMasa});
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
                    clientName: order.userName,
                    clientEmail: user.email,
                    clientTelephone: order.userTel,
                    products: cakeProducts,
                    createdAt: startDate,
                    deliveryTime: endDate,
                    avans: cakeTotal,
                }
                const tartOrder = {
                    clientName: order.userName,
                    clientEmail: user.email,
                    clientTelephone: order.userTel,
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

            const data = {name: user.name + ' ' + user.telephone, action: action}
            await sendInfoAdminEmail(data)
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
        res.status(404).json({ message: `Cant save order` });
    }
}

function formatedDateToShow(date){
    console.log(date)
    if(date){
      const inputDate = new Date(date);
      const hours = inputDate.getHours();
      const minutes = inputDate.getMinutes();
      const hour = hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
      const monthNames = [
        "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
        "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
      ];
      return `${inputDate.getDate().toString().padStart(2, '0')}-${monthNames[inputDate.getMonth()]}-${inputDate.getFullYear()} ora ${hour} `
    } else {
      return 'xx'
    }
    }

    // module.exports.renderMailTemplate = async (req, res, next) => {
    //     const order = await Order.findOne({}, {}, { sort: { 'createdAt': -1 }})
    //     let cakeProducts = order.products.filter(product => product.name.startsWith('Cozonac'));
    //     let cakeTotal = 0
    //     cakeProducts.forEach(el => {
    //         cakeTotal += el.total
    //     })
    //     const startDate = formatedDateToShow(order.createdAt)
    //     const endDate = formatedDateToShow(order.preOrderPickUpDate)
    //     const cakeOrder = {
    //         clientName: order.userName,
    //         clientEmail: "eeeeee@eee.com",
    //         clientTelephone: order.userTel,
    //         products: cakeProducts,
    //         createdAt: startDate,
    //         deliveryTime: endDate,
    //         avans: cakeTotal,
    //     }
    //     res.render('layouts/info-order', {data: cakeOrder})
    // }

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
            // to: "buraga.stefan@l-artisan.ro",
            subject: 'Comanda Nouă!',
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


// ********************* EDIT DATA****************************



module.exports.changeStatus = async (req, res, next) => {
    const { stat, id } = req.body
    try {
        const product = await Product.findById(id)
        if (product) {
            if (stat === 'activate') {
                product.available = true
            } else {
                product.available = false
            }
            await product.save()
            res.status(200).json(product)
        } else {
            const subProd = await SubProduct.findById(id)
            if (subProd) {
                if (stat === 'activate') {
                    subProd.available = true
                } else {
                    subProd.available = false
                }
                await subProd.save()
                res.status(200).json(subProd)
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err.message)
    }
}


module.exports.addParingProduct = async (req, res, next) => {
    try {
        const { productToEditId, productToPushId } = req.body
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productToEditId },
            { $push: { paring: productToPushId } },
            { new: true, useFindAndModify: false }
        ).populate([
            {path: 'paring', populate: { path: 'category', select: 'name' }},
            {path: 'subProducts'},
            {path: 'category', select: 'name'}
        ])
        const paringProduct = updatedProduct.paring.filter(obj => obj._id.toString() === productToPushId)
        res.status(200).json({ message: `Produsul ${updatedProduct.name} i-a fost asociat produsul ${paringProduct[0].name}`, updatedProduct })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.error.message })
    }
}

module.exports.removeParingProduct = async (req, res, next) => {
    try {
        const { productToBeRemovedId, productToRemoveFromId } = req.body;
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productToRemoveFromId },
            { $pull: { paring: productToBeRemovedId } },
            { new: true, useFindAndModify: false }
        ).populate([
            {path: 'paring', populate: { path: 'category', select: 'name' }},
            {path: 'subProducts'},
            {path: 'category', select: 'name'}
        ])
        res.status(200).json({ message: `Produsul a fost scos cu succes!`, updatedProduct })
    } catch (err) {
        console.log("Error", err)
        res.status(500).json({ messaje: err.error.error.message })
    }
}


module.exports.editCategory = async (req, res, next) => {
    const { categoryId, name, mainCat, order } = req.body
    if (categoryId) {
        const category = await Cat.findById(categoryId).populate({
            path: 'product',
            populate: [
                { path: 'category' },
                {
                    path: 'subProducts',
                    populate: {
                        path: 'product',

                    }
                }]
        }).maxTimeMS(20000)
        if (category) {
            category.name = name;
            category.mainCat = mainCat;
            category.order = parseFloat(order)
            if (req.file) {
                const { filename, path } = req.file
                await cloudinary.uploader.destroy(category.image.filename)
                category.image.path = path
                category.image.filename = filename
                await category.save();
                res.status(200).json({ message: `Categoria a fost modificată!`, category: category })
            } else {
                await category.save()
                res.status(200).json({ message: `Categoria a fost modificată!`, category: category })
            }
        } else {
            res.status(404).json({ message: 'Categoria nu a fost găsită în baza de date!' })
        }
    } else {
        res.status(404).json({ message: 'Lipsă ID categoie!!' })
    }
}


module.exports.editProduct = async (req, res, next) => {
    console.log('hit the route')
    const { id, category, name, price, qty, description, order, longDescription } = req.body
    try{
        if(req.query.sub){
            const subs = JSON.parse(req.query.sub)
            for(let el of subs){
                if(el._id){
                   await SubProduct.findOneAndUpdate({_id: el._id}, el)   
                }
            }
        }
        if (id) {
            const oldProduct = await Product.findById(id).populate({ path: 'category', select: 'name' }).populate({ path: 'subProducts' })
            if (oldProduct) {
                if(req.query.length){
                    oldProduct.ings = JSON.parse(req.query.ings)
                    oldProduct.toppings = JSON.parse(req.query.toppings)
                }
                oldProduct.name = name,
                    oldProduct.price = price
                oldProduct.qty = qty,
                    oldProduct.description = description;
                oldProduct.longDescription = longDescription;
                oldProduct.order = parseFloat(order);
                if (oldProduct.category._id.toString() !== category) {
                    try {
                        await Cat.updateOne({ _id: oldProduct.category._id }, { $pull: { product: oldProduct._id } })
                        await Cat.updateOne({ _id: category }, { $push: { product: oldProduct._id } })
                        oldProduct.category = category
                    } catch (error) {
                        console.log(error)
                        res.status(404).json({ messsage: "Ceva nu a mers bine la salvarea categoriilor", error: error.messsage })
                    }
                }
                if (req.file) {
                    const { filename, path } = req.file
                    await cloudinary.uploader.destroy(oldProduct.image.filename)
                    oldProduct.image.filename = filename;
                    oldProduct.image.path = path;
                    // await oldProduct.save()
                }
                console.log(oldProduct)
                await oldProduct.save()
                res.status(200).json({ message: 'Produst a fost modificat cu success!', product: oldProduct })
            } else {
                res.status(404).json({ message: 'Produsul nu a fost găsit in baza de date!' })
            }
        } else {
            res.status(404).json({ message: 'Lipsă ID produs!!' })
        }
    } catch( error){
        console.log(error)
        res.status(500).json({message: error})
    }
}


module.exports.editSubproduct = async (req, res, next) => {
    const { id, prodId, name, price, order } = req.body;
    if (id) {
        const oldSub = await SubProduct.findById(id).populate({ path: 'product', select: ['name', 'category'] });
        if (oldSub) {
            oldSub.name = name;
            oldSub.price = price;
            oldSub.order = order;
            if (oldSub.product._id.toString() !== prodId) {
                try {
                    await Product.updateOne({ _id: oldSub.product._id }, { $pull: { subProducts: oldSub._id } })
                    await Product.updateOne({ _id: prodId }, { $push: { subProducts: oldSub._id } })
                    oldSub.product = prodId
                } catch (err) {
                    console.log(err)
                    return res.status(404).json({ message: 'Ceva nu a mers bine' })
                }
            }
            await oldSub.save()
            const productToSend = await SubProduct.findById(id).populate({ path: 'product', select: 'category' })
            res.status(200).json({ message: 'Sub Produsl a fost modificat cu succes', subProd: productToSend })
        } else {
            res.status(404).json({ message: 'Sub Produsul nu a fost găsit in baza de date!' })
        }
    } else {
        res.status(404).json({ message: 'Lipsă ID  sub produs!!' })
    }
}


// *******************DELETE DATA*********************************


module.exports.delCategory = async (req, res, next) => {
    try {
        const { id } = req.query;
        const category = await Category.findById(id);
        if (!category.product.length) {
            if (!category.image.filename === 'no_image_patrat_pt8iod') {
                await cloudinary.uploader.destroy(category.image.filename)
            }
            await category.deleteOne()
            res.status(200).json({ message: 'Categoria a fost ștearsă cu success!' })
        } else {
            res.status(401).json({ message: 'Categoria nu poate fi ștersă deoarece are produse!' })
        }

    } catch (err) {
        console.log(err);
        res.status(err.status).json({ message: err.error.message })
    }

}

module.exports.delSubProduct = async (req, res, next) => {
    try {
        const { id } = req.query
        const sub = await SubProduct.findOne({ _id: id })
        await sub.deleteOne()
        res.status(200).json({ message: 'Produsl a fost șters cu succes!' })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: `Somethig went wrong! ${err.error.message}` })
    }
}

module.exports.delProduct = async (req, res, next) => {
    try {
        const { id } = req.query
        const product = await Product.findById(id)
        if (!product.subProducts.length) {
            if (!product.image.filename === 'no_image_dreptunghi_ktwclc') {
                await cloudinary.uploader.destroy(product.image.filename)
            }
            await product.deleteOne()
            res.status(200).json({ message: 'Produsul a fost șters cu succes' })
        } else {
            res.status(401).json({ message: 'Produsul nu poate fi șters deoarece are sub produse!' })
        }
    } catch (err) {
        console.log(err)
        res.status(err.status).json({ message: err.error.message })
    }
}



module.exports.checkProduct = async (req, res, next) => {
    const { subProdId, prodId, toppings } = req.body
    if (subProdId.length || subProdId.length && toppings.length) {
        const subProducts = await SubProduct.find({ _id: { $in: subProdId }, available: false }).populate({ path: 'product' })
        if (subProducts.length) {
            let productsName = []
            for (let product of subProducts) {
                productsName.push(` ${product.product.name}-${product.name}`)
            }
            if (productsName.length > 1) {
                res.status(226).json({ message: `Ne pare rău! Produsele ${productsName} nu mai sunt pe stoc! Dati refresh la pagina pentru a vedea meniul actualizat.` })
            } else {
                res.status(226).json({ message: `Ne pare rău! Produsul ${productsName} nu mai este pe stoc! Dati refresh la pagina pentru a vedea meniul actualizat.` })
            }
        } else {
            await checkTopping(toppings, res)
        }
    } else if (prodId.length || prodId.length && toppings.length) {
        const products = await Product.find({ _id: { $in: prodId }, available: false })
        if (products.length) {
            productName = []
            for (let product of products) {
                productName.push(product.name)
            }
            if (productName.length > 1) {
                res.status(226).json({ message: `Ne pare rău! Produsele ${productName} nu mai sunt pe stoc! Dati refresh la pagina pentru a vedea meniul actualizat.` })
            } else {
                res.status(226).json({ message: `Ne pare rău! Produsul ${productName} nu mai este pe stoc! Dati refresh la pagina pentru a vedea meniul actualizat.` })
            }
        } else {
            await checkTopping(toppings, res)
        }
    } 
}

function round(num) {
    return Math.round(num * 1000) / 1000;
}

async function checkTopping(toppings, res) {
    const blackList = await BlackList.findOne({name: 'True'})
    if(blackList.list.length){
        const matchBlackList = blackList.list.filter(item => toppings.includes(item))
        if(matchBlackList.length) {
           return res.status(226).json({message: `Ne pare rau! Produsele ${matchBlackList} nu mai sunt pe stoc!`})
        } else {
           return res.status(200).json({message: "All good"})
        }
    } else {
        return res.status(200).json({message: "All good"})
    }
}


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




// module.exports.register = async (req, res, next) => {
//     const hashedPassword = hashPassword('VefcemltfC');
//     const newUser = new User({
//         password: hashedPassword,
//         name: 'allisone',
//     });
//     await newUser.save()
//     res.status(200).json({ message: `allisone and allisdone ${newUser.password}` });

// }