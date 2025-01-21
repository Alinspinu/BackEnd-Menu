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


    module.exports.saveInv = async (req, res, next) => {
      try{
        const {date, loc} = req.body
        const invDate = new Date(date).setUTCHours(0,0,0,0)
        const ings = await Ingredient.find({locatie: loc, productIngredient: false, dep: { $in: ['marfa', 'materie'] }}).select('inventary name gestiune dep um')
        const ingredients = ings.map(ing => {
    
          let foundFirstMatch = false;
    
          let newIng = {}
          for(let inv of ing.inventary){
            if (foundFirstMatch) break;
            const day = new Date(inv.day).setUTCHours(0,0,0,0)
              if(day === invDate){
              newIng.faptic = inv.faptic
              newIng.scriptic = inv.qty
              newIng.name = ing.name
              newIng.ing = ing._id
              newIng.gestiune = ing.gestiune
              newIng.dep = ing.dep
              newIng.um = ing.um
              foundFirstMatch = true;
              
            }
          }
          return newIng
        })
        const filtredIngredients = ingredients.filter(ing => ing.name)
        const savedInventary = await Inventary.findOne({date: invDate, locatie: loc})
        if(savedInventary) {
          const update = {
            locatie: loc,
            date: invDate,
            ingredients: filtredIngredients
          }
          const modifiedInv = await Inventary.findOneAndUpdate({_id: savedInventary._id}, update, {new: true}).populate({path: 'ingredients.ing', select: 'price um'})
          res.status(200).json({message: 'Inventarul a fost actualizat!', inv: modifiedInv})
        } else {
          if(isEmpty(ingredients[0])){
            res.status(226).json({message: 'Erorare, nu a fost salavat invetarul scriptic!'})
          } else {
            const inv = new Inventary({
              locatie: loc,
              date: invDate,
              ingredients: filtredIngredients
            })
            const savedInv = await inv.save()
            await savedInv.populate({ path: 'ingredients.ing', select: 'price um' })
            res.status(200).json({message: 'Inventarul a fost salvat!', inv: savedInv})
          }
        }
      } catch(err){
        console.log(err)
        res.status(500).json(err)
      }
    }
    
    
    module.exports.saveInventary = async (req, res, next) => {
      const {loc} = req.body
      try {
        const date = new Date();
        date.setUTCHours(23, 0, 0, 0);
        const ings = await Ingredient.find({locatie: loc})
        console.log(ings.length)
        const updatePromises = ings.map(ing => {
          const index = ing.inventary && ing.inventary.length ? ing.inventary.length + 1 : 1;
    
          const entry = {
            index: index,
            day: date,
            qty: ing.qty
          };
    
          // Use updateOne to update the inventory field only
          return Ingredient.updateOne(
            { _id: ing._id },
            { $push: { inventary: entry } }
          ).exec();
        });
    
       const response = await Promise.all(updatePromises);
        console.log(response)
        res.status(200).json({ message: "inventary saved" });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
      }
    };
    
    module.exports.saveManualInventary = async (req, res, next) => {
    try{
    const {data} = req.body
    const ing  = await Ingredient.findById(data.ingId)
    ing.inventary.forEach(inv => {
      if(inv.index === data.invIndex){
        inv.faptic = data.qtyInv
        inv.qty = data.scriptic
      }
    })
    const newIng = await ing.save()
    res.status(200).json({message: 'Inventarul a fost actualizat', ing: newIng})
    } catch(err){
    console.log(err)
    res.status(500).json({message: err.message})
    }
    }



