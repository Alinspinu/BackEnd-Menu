
const Product = require('../../models/office/product/product')
const Cat = require('../../models/office/product/cat')
const SubProduct = require('../../models/office/product/sub-product')
const Ingredient = require('../../models/office/inv-ingredient')
const Section = require('../../models/office/product/print-section')
const Dep = require('../../models/office/product/dep')
const Gestiune = require('../../models/office/product/gestiune')
const mongoose = require('mongoose')
const cloudinary = require('cloudinary').v2;

const {checkTopping, round} = require('../../utils/functions')



module.exports.changeVat = async (req, res) => {
    try{

        const subP = await SubProduct.find({locatie: "655e2e7c5a3d53943c6b7c53"}).populate({path: 'Product', select: 'mainCat'})
        const products = await Product.find({locatie: "655e2e7c5a3d53943c6b7c53"}).populate({path: 'category', select: 'name'})
        
        for(let s of subP){
            if(s.product.mainCat === 'coffee'){
                s.price = s.price + 1
                console.log(s.product.name, ' ',  s.name, '---', s.price)
                await s.save()
            }
        }

        for(let p of products){
            if(p.category.name === 'COCKTAILS' || p.mainCat === 'coffee'){
                p.price = p.price + 1
                console.log(p.name, '---', p.price)
                await p.save()
            }
        }
        
        console.log('Numar de produse', products.length)
        console.log('Numar de sub', subP.length)
        res.status(200).json({message: 'all done'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.updateProducts = async (req, res) => {
    try{    

        const products = await Product.find({category: '64c8078d378605eb04628214'}).populate({path: 'subProducts'})
        console.log('produse gasite', products.length)
        for(const product of products){
            for( const sub of product.subProducts){
                if(sub.name === 'Decofeinizat'){
                   const description = 'Țară de origine: Columbia, | Procesare: Fermentare Naturală, | Decofeinizată cu: Acetat de etil provenit din trestie de zahăr, | Profil aromatic: [caramel sărat, alune, scorțișoară și coji de portocală.]'
                // const description = 'Blendul emblematic [True Fine Coffee], format din 80% Brazilia Agua Limpa și 20% Papua Noua Guinee. Are un corp [intens] cu note de [alune de pădure, cacao și ciocolată.]'
                    await SubProduct.findByIdAndUpdate(sub._id, {description: description})
                }
            }
        }

       res.status(200).json({message: 'All done'})
    } catch(error){
        res.status(500).json(error)
        console.log(error)
    }
}

  const description = 'Blendul emblematic [True Fine Coffee], format din 80% Brazilia Agua Limpa și 20% Papua Noua Guinee. Are un corp [intens] cu note de [alune de pădure, cacao și ciocolată], perfect completate de crema de lapte, care îl transformă într-o experiență de neuitat.'

// 'Această cafea se remarcă prin boabe atent selectate și metode de procesare creative, care dau naștere unor arome spectaculoase.  // Cafeaua provine din Columbia și este co-fermentată cu nucă de cocos, proces ce-i oferă un profil aromatic unic, cu note de nucă de cocos, mango, kiwi și un corp cremos asemănător iaurtului cu căpșuni.'



 module.exports.getProducts = async (req, res, next) => {
    try{
      const {loc, point} = req.body
      const products = await Product.find({locatie: loc, salePoint: point}).populate([
        {path: 'category', select: 'name'}, 
        {
            path: 'subProducts', populate: {
                path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um ings productIngredient qty', 
                    populate: {
                        path: 'ings.ing', select: 'name tvaPrice qty um' 
                    }
            }
        },
        {
            path: 'toppings', select: 'qty name ing price um', 
            populate: {
                path: 'ing', select: 'name tvaPrice um ings productIngredient gestiune qty', 
                populate: {
                    path: 'ings', select: 'qty ing', 
                    populate: {
                        path: 'ing', select: 'name tvaPrice qty um'
                    }
                }
            }
        },
        {
            path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um productIngredient ings qty', 
                populate: {
                    path: 'ings.ing', select: 'name tvaPrice qty um'
                }
        },
    ])
      const sortedProducts = products.sort((a, b) => a.name.localeCompare(b.name))
      res.status(200).json(sortedProducts)
    } catch(error) {
      console.log(error);
      res.status(500).json({message: error})
    }
  }

  module.exports.getProduct = async (req, res, next) => {
    try{
      const product = await Product.findById(req.query.id).populate([
        {
            path: 'subProducts', populate: {
                path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um ings productIngredient qty', 
                    populate: {
                        path: 'ings.ing', select: 'name tvaPrice qty um'
                    }
            }
        },
        {path: "category", select: 'name'},
        {
            path: 'toppings', select: 'qty name ing price um', 
            populate: {
                path: 'ing', select: 'name tvaPrice um ings productIngredient gestiune qty', 
                populate: {
                    path: 'ings', select: 'qty ing', 
                    populate: {path: 'ing', select: 'name tvaPrice qty um'

                    }
                }
            }
        },
        {
            path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um productIngredient ings qty', 
                populate: {
                    path: 'ings.ing', select: 'name tvaPrice qty um'
                }
        },
    ])
      res.status(200).json(product)
    }catch(error) {
      console.log(error)
      res.status(500).json({message: error})
    }
  }


  module.exports.updateProductIngPeice = async (req, res, next) => {
    try{
        const { loc } = req.body;
        const ingredients = await Ingredient.find({locatie: loc, productIngredient: true}).populate({path: 'ings.ing'})
        if(ingredients) {
            for(let ing of ingredients) {
                let total = 0
                    for(let igr of ing.ings){
                        total += igr.qty * igr.ing.price
                    }
                    ing.price = round(total)
                    await Ingredient.findByIdAndUpdate(ing._id, {price: round(ing.price)})
                    // console.log(`Ingredientul ${ing.name} are totalul ${round(ing.price)}`)
            }
        }
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
  }

module.exports.addProd = async (req, res, next) => {
    try {
        const {data} = req.body
        const product = JSON.parse(data)
        const cat = await Cat.findById(product.category);
        if(cat.name === 'VANZARE') product.available = false
        const subProducts = JSON.parse(JSON.stringify(product.subProducts)) 
        product.subProducts = []
        const newProduct = new Product(product)
        const savedProduct = await newProduct.save()
        cat.product.push(savedProduct._id);
        await cat.save()
        if(subProducts.length){
            for(let sub of subProducts){
                sub.product = savedProduct._id
                const ingredients = sub.ings.map(i => ({qty: i.qty, ing: i.ing._id}))
                sub.ings = ingredients
                const newSubProduct = new SubProduct(sub)
                const savedSubProduct = await newSubProduct.save()
                savedProduct.subProducts.push(savedSubProduct._id)
                await savedProduct.save()
            }
        }
  
        const productToSend = await Product.findById(savedProduct._id).populate([
            {
                path: 'subProducts', populate: {
                    path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um ings productIngredient qty', 
                        populate: {
                            path: 'ings.ing', select: 'name tvaPrice qty'
                        }
                }
            },
            {path: "category", select: 'name'},
            {
                path: 'toppings', select: 'qty name ing price um', 
                populate: {
                    path: 'ing', select: 'name tvaPrice um ings productIngredient gestiune qty', 
                    populate: {
                        path: 'ings', select: 'qty ing', 
                        populate: {
                            path: 'ing', select: 'name tvaPrice qty um'
    
                        }
                    }
                }
            },
            {
                path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um productIngredient ings qty', 
                    populate: {
                        path: 'ings.ing', select: 'name tvaPrice qty um'
                    }
            },
        ]);
        res.status(200).json({ message: `Product ${product.name} was created!`, product: productToSend });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
  }



module.exports.editProduct = async (req, res, next) => {
    const { product } = req.body
    const parsedProduct = JSON.parse(product)
    try{
            const oldProduct = await Product.findById(parsedProduct._id)
            if (oldProduct.category.toString() !== parsedProduct.category) {
                try {
                    await Cat.updateOne({ _id: oldProduct.category }, { $pull: { product: oldProduct._id } })
                    await Cat.updateOne({ _id: parsedProduct.category }, { $push: { product: oldProduct._id } })
                } catch (error) {
                    console.log(error)
                    res.status(404).json({ messsage: "Ceva nu a mers bine la salvarea categoriilor", error: error.messsage })
                }
            }
            for (let oldImage of oldProduct.image) {
                const newImageIndex = parsedProduct.image.findIndex(i => i.filename === oldImage.filename);
                if (newImageIndex === -1) {
                  if (oldImage.filename) {
                    try {
                      await cloudinary.uploader.destroy(oldImage.filename);
                      console.log(`Deleted old image with public_id: ${oldImage.filename}`);
                    } catch (error) {
                      console.error(`Failed to delete old image with public_id: ${oldImage.filename}`, error);
                    }
                  } else {
                    console.warn('No public_id found for old image, cannot delete.');
                  }
                }
              }
              const newProduct = await Product.findByIdAndUpdate(parsedProduct._id, parsedProduct, {new: true}).populate([
                {
                    path: 'subProducts', populate: {
                        path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um ings productIngredient qty', 
                            populate: {
                                path: 'ings.ing', select: 'name tvaPrice qty um' 
                            }
                    }
                },
                {path: "category", select: 'name'},
                {
                    path: 'toppings', select: 'qty name ing um', 
                    populate: {
                        path: 'ing', select: 'name tvaPrice um ings productIngredient gestiune qty', 
                        populate: {
                            path: 'ings', select: 'qty ing', 
                            populate: {path: 'ing', select: 'name tvaPrice qty um'
        
                            }
                        }
                    }
                },
                {
                    path: 'ings.ing', select: 'gestiune name locatie price sellPrice tvaPrice tva um productIngredient ings qty', 
                        populate: {
                            path: 'ings.ing', select: 'name tvaPrice qty um'
                        }
                },
            ])
            res.status(200).json({ message: `Produst ${oldProduct.name} a fost modificat cu success!`, product: newProduct })
          
    } catch( error){
        console.log(error)
        res.status(500).json({message: error.message})
    }
}

module.exports.setProductDiscount = async (req, res, next) => {
    try{
        const catId = []
        const {data} = req.body
        for(let obj of data){
            catId.push(obj.cat)
        }
        const cats = await Cat.find({_id: { $in: catId }}).populate({path:'product', select:'name'})
        for(let cat of cats){
            for(let obj of data){
                if(obj.name === cat.name)
                for(let product of cat.product){
                  const updatedProducts =  await Product.findByIdAndUpdate(product._id, {discount: obj.precent}, {new: true})
                }
            }
        }
        res.status(200).json({message: `Discount a fost actualizat!`})
    }catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.setDiscountProd = async (req, res, next) => {
    try{
        const {data} = req.body;
        for(let obj of data) {
            await Product.findByIdAndUpdate(obj.productId, {discount: obj.precent})
        }
        res.status(200).json({message: `Discountul a fost actualizat!`})
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.checkProductStatus = async (req, res) => {
    try{
        const {id} = req.query
        console.log(id)
        const product = await Product.findById(id)
        if(product && product.available){
            res.status(200).json({av: true})
        } else {
            res.status(200).json({av: false})
        }
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.checkProduct = async (req, res, next) => {
    try{
        const loc = req.query.loc
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
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.delProduct = async (req, res, next) => {
    try {
        const { id } = req.query
        const product = await Product.findById(id)
        if (!product.subProducts.length) {
            if (product.image.length) {
                for(let image of product.image){
                    if(image.filename){
                        try{
                            await cloudinary.uploader.destroy(image.filename)
                            console.log(`imaginea produsului a fost stearsa cu succes! ${image.filename}`)
                        } catch(error){
                            console.warn(`A aparut o erorare la stergerea imaginii ${error.message}`)
                        }
                    } else {
                        console.warn('Imaginea nu apre public_id!')
                    }
                }
            }
            await product.deleteOne()
            res.status(200).json({ message: 'Produsul a fost șters cu succes' })
        } else {
            res.status(401).json({ message: 'Produsul nu poate fi șters deoarece are sub produse!' })
        }
    } catch (err) {
        console.log(err)
        res.status(err.status).json({ message: err.message })
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




module.exports.addSection = async (req, res) => {
    const {section} = req.body
    try{

        const newSection = new Section(section)
        const savedSection = await newSection.save()
        res.status(200).json({message: 'Secția a fost salvată cu success!', section: savedSection})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getSections = async (req, res) => {
    const {loc, point} = req.query;
    try{
        const sections = await Section.find({locatie: loc, salePoint: point})
        res.status(200).json(sections) 
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.editSection = async (req, res) => {
    const {section} = req.body
    try{

        const updatedSection = await Section.findByIdAndUpdate(section._id, section, {new: true})
        res.status(200).json({message: 'Secția a fost actualizată', section: updatedSection})

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deleteSection = async (req, res) => {
    const {id} = req.query;
    try{
        const section = await Section.findById(id)

        if (!section) {
            return res.status(404).json({ message: 'Secția nu a fost găsită.' });
          }
    
        await Product.updateMany({printSection: section._id},   { $unset: { printSection: "" } })
        await section.deleteOne()
        
        res.status(200).json({message: 'Secția a fost șteasă și produsele au fost actualizate!'})
    } catch(error){
        console.error('Error deleting section:', error);
        res.status(500).json({ message: 'Eroare la ștergerea secției.', error });
    }
}

















  




