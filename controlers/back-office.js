const Suplier = require('../models/office/suplier')
const Nirr = require('../models/office/nir')
const Ingredient = require('../models/office/inv-ingredient')
const Locatie = require('../models/office/locatie')
const Product = require('../models/product/product-true')
const Category = require('../models/product/cat-true')
const mongoose = require('mongoose')

module.exports.addSuplier = async (req, res, next) => {
 const {suplier} = req.body;
 const {personal} = req.query
 try{
    if(personal === 'true') {
        const newLocation = new Locatie(suplier) 
        await newLocation.save()
        console.log(newLocation)
        res.status(200).json({message: `Locatia ${newLocation.name} a fost salvată cu success!`})
    } else {
        const newSuplier = new Suplier(suplier);
        await newSuplier.save();
        res.status(200).json({message: `Furnizorul ${newSuplier.name} a fost salvat cu success!`})
    }
 } catch(err){
    console.log(err)
    res.status(500).json({message: "Oups something went wrong!", err: err})
 }
}

module.exports.sendSuplier = async (req, res, next) => {
    try{
        let furNames = [];
        let cif = [];
        let Id = [];
        const userData = req.body.search;
            const suplier = await Suplier.find();
            suplier.forEach(function (el) {
                furNames.push(el.name);
                cif.push(el.vatNumber);
                Id.push(el._id); 
            });
            let furNameUm = furNames.map((val, index) => ({
                name: val,
                vatNumber: cif[index],
                _id: Id[index],
            }));
            let result = furNameUm.filter((object) =>
            object.name.toLocaleLowerCase().includes(userData.toLocaleLowerCase())
            );
            
            res.status(200).json(result);
 

    } catch(err){
        console.log(err)
        res.status(500).json({message: "Oups something went wrong", err: err})
    }
}

module.exports.saveNir = async( req, res, next) => {
    const {nir} = req.body;
        const newNir = new Nirr(nir)
        await newNir.save()
        console.log(newNir)
        const promises = nir.ingredients.map((el) => {
          return Ingredient.updateOne(
            { name: el.name, gestiune: el.gestiune },
            {
              $setOnInsert: {
                um: el.um,
                tva: el.tva,
                gestiune: el.gestiune,
              },
              $set: {
                price: el.price,
                tva: el.tva,
                tvaPrice: round(el.price * (1 + el.tva / 100)),
              },
              $inc: {qty: el.qty}
            },
            { upsert: true, new: true }
          ).exec();
        });
      
        Promise.all(promises)
          .then((results) => {
            console.log(`Updated/created documents: ${results}`);
            res.status(200);
          })
          .catch((err) => {
            console.log(`Error: ${err}`);
            next(err);
          });
        
}

module.exports.saveIng = async(req, res, next) => {
  const {ing} = req.body;
  const newIng = new Ingredient(ing)
  await newIng.save()
  res.status(200).json({message: `Ingredientul ${newIng.name} a fost salvat cu succes!`})
}


  module.exports.searchIng = async (req, res, next) => {
    const {prod} = req.query;
    let name = [];
    let um = [];
    let tva = [];
    let price = [];
    let qty = [];
    let dep = [];
    let gestiune = [];
    const userData = req.body.search;
    const ings = await Ingredient.find({});
    ings.forEach((el) => {
      name.push(el.name);
      um.push(el.um);
      tva.push(el.tva);
      price.push(el.price);
      qty.push(el.qty);
      dep.push(el.dep);
      gestiune.push(el.gestiune);
    });
    if(prod && prod === "true"){
      let ingNameProd = name.map((val, index) => ({
        name: val,
        um: um[index],
        price: price[index],
        qty: 0
      }));
      let ingForProduct = ingNameProd.filter((object) =>
      object.name.toLocaleLowerCase().includes(userData.toLocaleLowerCase())
    );
    res.status(200).json(ingForProduct)
    } else {
      let ingNameUm = name.map((val, index) => ({
        name: val,
        um: um[index],
        tva: tva[index],
        price: price[index],
        qty: qty[index],
        dep: dep[index],
        gestiune: gestiune[index],
      }));
      let result = ingNameUm.filter((object) =>
        object.name.toLocaleLowerCase().includes(userData.toLocaleLowerCase())
      );
      res.status(200).json(result);
    }
  };

  module.exports.getProducts = async (req, res, next) => {
    try{
      let filterTo = {}
      const {filter} = req.body;
      if(filter.mainCat.length){
        filterTo.mainCat = filter.mainCat
      }
      if(filter.cat.length){
        filterTo.category = new mongoose.Types.ObjectId(filter.cat);
      } 
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



function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }