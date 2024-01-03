const Ingredient = require('../../models/office/inv-ingredient')
const ProductIngredient = require('../../models/office/inv-prod-ing')
const Product = require('../../models/office/product/product')
const SubProduct = require('../../models/office/product/sub-product')
const locatie = '655e2e7c5a3d53943c6b7c53'



module.exports.saveIng = async(req, res, next) => {
    const {ing} = req.body;
    const checkIng = await Ingredient.findOne({name: ing.name, gestiune: ing.gestiune})
    if(checkIng){
      return res.status(226).json({message: "Ingredientul deja exista în baza de date!"})
    } else {
      const newIng = new Ingredient(ing)
      newIng.locatie = '655e2e7c5a3d53943c6b7c53'
      await newIng.save()
      return res.status(200).json({message: `Ingredientul ${newIng.name} a fost salvat cu succes!`})
    }
  }
  
  
    module.exports.searchIng = async (req, res, next) => {
      try{  
        let data = []
        const userData = req.body.search;
        const ings = await Ingredient.find({locatie: locatie}).populate({path: 'ings.ing'});
        let filterData = ings.filter((object) =>
        object.name.toLocaleLowerCase().includes(userData.toLocaleLowerCase()))
        res.status(200).json(filterData)
      }catch (err) {
        console.log(err)
        res.status(500).json({message: err})
      }
    };

    module.exports.deleteIng = async (req, res, next) => {
      try{
        const {id} = req.query;
        const ing = await Ingredient.findById(id)
        await ing.deleteOne();
        res.status(200).json({message: `Ingredientul ${ing.name} a fost sters cu succes!`})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }
    module.exports.editIng = async (req, res, next) => {
      try{  
        const {id} = req.query;
        const {newIng} = req.body;
        const ing = await Ingredient.findByIdAndUpdate(id, newIng, {new: true});
        res.status(200).json({message: `Ingredientul ${ing.name} a fost actualizat cu succes!`})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }


    module.exports.addProdIng = async (req, res, next) => {
      try{
        const {productIngredient} = req.body;
        const newProduct = new ProductIngredient(productIngredient)
        await newProduct.save()
        res.status(200).json({message: `Produsul ingredient ${newProduct.name} a fost savat cu succes!`})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }

    module.exports.editProdIng = async (req, res, next) => {
      try{
          const {id} = req.query
          const {newProdIng} = req.body
          const prodIng = await ProductIngredient.findByIdAndUpdate(id, newProdIng, {new: true})
          res.status(200).json({message:`Produsul ${prodIng.name} a fost modificat cu success!`})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }
    module.exports.deleteProdIng = async (req, res, next) => {
      try{
        const {id} = req.query;
        const prodIng = await ProductIngredient.findById(id);
        await prodIng.deleteOne();
        res.status(200).json({message: `Produsl ${prodIng.name} a fost sters cu succes!`})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }