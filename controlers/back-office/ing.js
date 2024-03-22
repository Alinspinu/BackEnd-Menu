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
      console.log(loc)
      try{  
        let filterTo = {}
        const filter = req.body.filter
        if(filter && filter.gestiune && filter.gestiune.length){
          filterTo.gestiune = filter.gestiune
        }
        if(filter &&  filter.type && filter.type.length){
          if(filter.type === "compus"){
            filterTo.ings = { $exists: true, $ne: [] }
          } else {
            filterTo.ings = { $eq: [] }
          }
        }
        if(filter && filter.dep && filter.dep.length){
          filterTo.dep = filter.dep
        }
        filterTo.locatie = loc
        const ings = await Ingredient.find(filterTo).populate({path: 'ings.ing'});
        const sortedIngs = ings.sort((a, b) => a.name.localeCompare(b.name))
        res.status(200).json(sortedIngs)
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


    module.exports.saveInventary = async (req, res, next) => {
      try{
        const {loc} = req.query
        const ings = await Ingredient.find({locatie: loc})
        for(let ing of ings) {
          const date = new Date();
          date.setHours(23, 0, 0, 0, 0);
          const formattedDate = date.toISOString();
          let index = 1
          if(ing.inventary && ing.inventary.length){
            index += ing.inventary.length  
          } else {
            index = 1
          }
          const entry = {
            index: index,
            day: formattedDate,
            qty: ing.qty
          }
          ing.inventary.push(entry)
           await ing.save()
        } 
        res.status(200).json({message: "inventary saved"})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }











  











