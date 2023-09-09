if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const Product = require('../models/product-true')
const SubProduct = require('../models/sub-product')
const Category = require('../models/cat-true')
const Cat = require('../models/cat-true')
const User = require('../models/user-true')
const Order = require('../models/order-true')
const { cloudinary } = require('../cloudinary');



// ************SEND ALL DATA TO THE APP***************

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
                {
                    path: 'paring',
                    select: 'name'
                }
            ]
        }).maxTimeMS(20000);
        res.status(200).json(cats);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.message })
    }
}


// **********************SAVE DATA*************************

module.exports.saveSubProd = async (req, res, next) => {
    try {
        const { id, name, price, order } = req.body;
        const product = await Product.findById(id);
        const newSubProduct = new SubProduct({
            name: name,
            price: price,
            product: id,
            order: parseFloat(order),
        });
        product.subProducts.push(newSubProduct);
        await newSubProduct.save();
        await product.save();
        const subToSend = await SubProduct.findById(newSubProduct._id).populate({ path: 'product', select: 'category' });
        res.status(200).json({ message: `${name}, was saved in ${product.name}`, subProduct: subToSend })
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
        const nutrition = JSON.parse(req.body.strNutrition);
        const allergens = JSON.parse(req.body.strAllergens);
        const { category } = req.body;
        const cat = await Cat.findById(category);
        const product = new Product(req.body);
        product.order = parseFloat(req.body.order);
        product.price = parseFloat(req.body.price);
        product.nutrition = nutrition;
        product.allergens = allergens;
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
        res.status(500).json({ message: err.error.message });
    }
}



module.exports.saveOrder = async (req, res, next) => {
    try {
        const newOrder = new Order(req.body)
        const userId = req.body.user;
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
            await newOrder.save()
            res.status(200).json({ user: user, orderId: newOrder._id });
        } else {
            await newOrder.save();
            res.status(200).json({ message: 'Order Saved Without a user', orderId: newOrder._id });
        }
    } catch (err) {
        res.status(404).json({ message: `Cant save order ${err.error.message}` });
        console.log('Error', err.message);
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


module.exports.addParrinProducts = async (req, res, next) => {
    try {
        const { productToEditId, productToPushId } = req.body
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productToEditId },
            { $push: { paring: productToPushId } },
            { new: true, useFindAndModify: false }
        ).populate({
            path: 'paring',
            select: 'name'
        })
        const paringProduct = updatedProduct.paring.filter(obj => obj._id.toString() === productToPushId)
        res.status(200).json({ message: `Produsul ${updatedProduct.name} i-a fost asociat produsul ${paringProduct[0].name}`, updatedProduct })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.error.message })
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
    const { id, category, name, price, qty, description, order, strAllergens, strNutrition, longDescription } = req.body
    if (id) {
        const oldProduct = await Product.findById(id).populate({ path: 'category', select: 'name' }).populate({ path: 'subProducts' })
        if (oldProduct) {
            oldProduct.name = name,
                oldProduct.price = price
            oldProduct.qty = qty,
                oldProduct.description = description;
            oldProduct.longDescription = longDescription;
            oldProduct.order = parseFloat(order);
            oldProduct.nutrition = JSON.parse(strNutrition);
            oldProduct.allergens = JSON.parse(strAllergens);
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



// ********************VERIFY DATA******************************

module.exports.checkProduct = async (req, res, next) => {
    const { subProdId, prodId } = req.body
    if (subProdId.length) {
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
            res.status(200).json({ message: `All good` })
        }
    } else if (prodId.length) {
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
            res.status(200).json({ message: `All good` })
        }
    }
}

function round(num) {
    return Math.round(num * 1000) / 1000;
}





// module.exports.register = async (req, res, next) => {
//     const hashedPassword = hashPassword('VefcemltfC');
//     const newUser = new User({
//         password: hashedPassword,
//         name: 'allisone',
//     });
//     await newUser.save()
//     res.status(200).json({ message: `allisone and allisdone ${newUser.password}` });

// }