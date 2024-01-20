if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const Ingredient = require('../models/nutrition/ingredient')
const Product = require('../models/office/product/product')
const ProdIngredient = require('../models/nutrition/prod-ingredient')



// ##################### SEND DATA ###############################


module.exports.sendIngredients = async(req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        let ing = []
        const ingredients = await Ingredient.find({locatie: loc})
        res.status(200).json(ingredients)
    }catch (err) {  
        console.log(err)
        res.status(500).json({ message: err });
    }
}


// ##################### SAVE DATA ###############################

module.exports.saveIngredient = async(req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try {
        const ing = new Ingredient(req.body);
        ing.locatie = loc
        await ing.save()
        res.status(200).json({ message: `Ingredientul ${ing.name} was created!`});
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
}


module.exports.saveIngredientsToProduct = async (req, res, next) => {
    const {id} = req.query
    try{
        const product = await Product.findById(id)
        product.ingredients = req.body
        await product.save()
    }catch (err) {  
        console.log(err)
        res.status(500).json({ message: err });
    }
}

module.exports.saveProductIngredient = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try {
        const {name} = req.query;
        const prodIng = new ProdIngredient({
            name,
            ingredients: req.body,
            locatie: loc,
        })
        await prodIng.save()
        const updatedProdIng = await ProdIngredient.findOne({name: name, locatie: loc}).populate({path: 'ingredients.ingredient'})
        const result = calcNutrition(updatedProdIng.ingredients)
        const ing = new Ingredient(result)
        ing.locatie = loc
        ing.name = name,
        await ing.save()
        res.status(200).json({ message: `Product-Ingredient ${name} was created!`});
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
}

// ##################### EDIT DATA ###############################

module.exports.editIngredient = async(req, res, next) => {
    try{
        const {id} = req.query;
        const ing = await Ingredient.findOneAndUpdate({_id: id}, req.body, {new: true}); 
        res.status(200).json({message: `Ingredientul ${ing.name} was updated!`})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err})
    }
}


// ##################### Delete Data ###############################
module.exports.deleteIngredient = async (req, res, next) => {
    try{
        const {id} = req.query;
        await Ingredient.findByIdAndDelete(id);
        res.status(200).json({message: "Ingredientul a fost șters!"})
    } catch (err){
        console.log(err)
        res.status(500).json({message: err})
    }
}


// ##################### Functions ###############################

function calcNutrition(ingredients){
    const prefixes = ['energy', 'carbs', 'fat', 'salts', 'protein']
    const qty = ingredients.reduce((acc, obj) => acc + obj.quantity, 0)
    const result = ingredients.reduce((acc, obj) => {
      Object.keys(obj.ingredient._doc).forEach(key => {
        if (prefixes.some(prefix => key.startsWith(prefix))) {
          if (typeof obj.ingredient._doc[key] === 'object') {
            Object.keys(obj.ingredient._doc[key]).forEach(subKey => {
              acc[key] = acc[key] || {};
              acc[key][subKey] = round(((acc[key][subKey] || 0) + (obj.ingredient._doc[key][subKey] * (obj.quantity / 100)))/(qty/100));
            });
          } else {
            acc[key] = round(((acc[key] || 0) + (obj.ingredient._doc[key] * (obj.quantity / 100)))/(qty/100));
          }
        } else if((Array.isArray(obj.ingredient._doc[key]))) {
          acc[key] = acc[key] || [];
          obj.ingredient._doc[key].forEach(item => {
              const index = acc[key].findIndex(obj => obj.name === item.name)
              if (index === -1) {
                  acc[key].push(item);
              }
          });
        }
      });
      return acc;
    },{});
   return result
}


function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
} 