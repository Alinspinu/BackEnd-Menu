const Ingredient = require('../../models/office/inv-ingredient')




module.exports.saveIng = async(req, res, next) => {
    const {ing} = req.body;
    const {loc} = req.body;
    const checkIng = await Ingredient.findOne({name: ing.name, gestiune: ing.gestiune})
    if(checkIng){
      return res.status(226).json({message: "Ingredientul deja exista în baza de date!"})
    } else {
      const newIng = new Ingredient(ing)
      newIng.locatie = loc
      await newIng.save()
      return res.status(200).json({message: `Ingredientul ${newIng.name} a fost salvat cu succes!`})
    }
  }

  
  
    module.exports.searchIng = async (req, res, next) => {
      const loc = req.body.loc
      try{  
        let filterTo = {}
        const filter = req.body.filter
        if(filter && filter.gestiune.length){
          filterTo.gestiune = filter.gestiune
        }
        if(filter && filter.type.length){
          if(filter.type === "compus"){
            filterTo.ings = { $exists: true, $ne: [] }
          } else {
            filterTo.ings = { $eq: [] }
          }
        }
        if(filter && filter.dep.length){
          filterTo.dep = filter.dep
        }
        const userData = req.body.search;
        filterTo.locatie = loc
        const ings = await Ingredient.find(filterTo).populate({path: 'ings.ing'});
        const sortedIngs = ings.sort((a, b) => a.name.localeCompare(b.name))
        let filterData = sortedIngs.filter((object) =>
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


  



