const Ingredient = require('../../models/office/inv-ingredient')
const ProductIngredient = require('../../models/office/inv-prod-ing')





module.exports.saveIng = async(req, res, next) => {
    const {ing} = req.body;
    const checkIng = await Ingredient.findOne({name: ing.name})
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
        const userData = req.body.search;
        const ings = await Ingredient.find({locatie: '655e2e7c5a3d53943c6b7c53'});
        let ingForProduct = ings.filter((object) =>
        object.name.toLocaleLowerCase().includes(userData.toLocaleLowerCase()))
        res.status(200).json(ingForProduct)
      }catch (err) {
        console.log(err)
        res.status(500).json({message: err})
      }
    };

    module.exports.deleteIng = async (req, res, next) => {
      try{

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
        console.log(newProduct)
        res.status(200).json({message: 'Produsul ingredient a fost savat cu succes!'})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }