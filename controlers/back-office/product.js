
const Product = require('../../models/office/product/product')
const Cat = require('../../models/office/product/cat')
const SubProduct = require('../../models/office/product/sub-product')
const mongoose = require('mongoose')
const cloudinary = require('cloudinary').v2;

const {checkTopping} = require('../../utils/functions')

 module.exports.getProducts = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
      let filterTo = {}
      const {filter} = req.body;
      if(filter.mainCat.length){
        filterTo.mainCat = filter.mainCat
      }
      if(filter.cat.length){
        filterTo.category = new mongoose.Types.ObjectId(filter.cat);
      } 
      filterTo.locatie = loc
      const products = await Product.find(filterTo).populate([{path: 'category', select: 'name'}, {path: 'subProducts'}])
      const sortedProducts = products.sort((a, b) => a.name.localeCompare(b.name))
      let filterProducts = []
      if(req.query.search.length){
        filterProducts = sortedProducts.filter((object) =>
        object.name.toLocaleLowerCase().includes(req.query.search.toLocaleLowerCase())
        );
      } else {
        filterProducts = sortedProducts
      }
      res.status(200).json(filterProducts)
    } catch(error) {
      console.log(error);
      res.status(500).json({message: error})
    }

  }

  module.exports.getProduct = async (req, res, next) => {
    try{
      const product = await Product.findById(req.query.id).populate([{path: 'subProducts'}, {path: "category", select: 'name'}])
      res.status(200).json(product)
    }catch(error) {
      console.log(error)
      res.status(500).json({message: error})
    }
  }



  module.exports.addProd = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try {
        const { category } = req.body;
        const cat = await Cat.findById(category);
        const product = new Product(req.body);
        product.order = parseFloat(req.body.order);
        product.price = parseFloat(req.body.price);
        product.locatie = loc
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


module.exports.editProduct = async (req, res, next) => {
    const { category, name, price, qty, description, order, longDescription, printer, tva, dep } = req.body
    const { id } = req.query
    try{
        if(req.query.sub){
            const subs = JSON.parse(req.query.sub)
            for(let el of subs){
                if(el._id){
                    console.log(el)
                   await SubProduct.findOneAndUpdate({_id: el._id}, el)   
                }
            }
        }

        if (id) {
            const oldProduct = await Product.findById(id).populate({ path: 'category', select: 'name' }).populate({ path: 'subProducts' })
            if (oldProduct) {
                if(req.query.ings){
                    oldProduct.ings = JSON.parse(req.query.ings)
                }
                if(req.query.toppings){
                    oldProduct.toppings = JSON.parse(req.query.toppings)
                }
                oldProduct.name = name;
                oldProduct.price = price;
                oldProduct.qty = qty;
                oldProduct.description = description;
                oldProduct.longDescription = longDescription;
                oldProduct.printer = printer;
                oldProduct.tva = tva;
                oldProduct.dep = dep;
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
                }
                await oldProduct.save()
                res.status(200).json({ message: `Produst ${oldProduct.name} a fost modificat cu success!`, product: oldProduct })
            } else {
                res.status(404).json({ message: 'Produsul nu a fost găsit in baza de date!' })
            }
        } else {
            res.status(404).json({ message: 'Lipsă ID produs!!' })
        }
    } catch( error){
        console.log(error)
        res.status(500).json({message: error.message})
    }
}



module.exports.checkProduct = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
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
            await checkTopping(toppings, res, loc)
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
            await checkTopping(toppings, res, loc)
        }
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