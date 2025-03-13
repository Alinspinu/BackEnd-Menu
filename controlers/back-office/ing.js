const Ingredient = require('../../models/office/inv-ingredient')
const Inventary =require('../../models/office/inventary')
const Sheet = require('../../models/utils/sheet')



module.exports.saveSheet = async (req, res) => {
  const {sheet} = req.body
  try{
    const sh = new Sheet(sheet)
    const savedSheet = await sh.save()
    res.status(200).json({sheet: savedSheet, message: 'Fișă de iesiri salvată cu success, stocul a fost actualizat!'})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.deleteSheet = async (req, res) => {
  const {id} = req.query
  try{
    const sheet = await Sheet.findById(id)
    if(sheet){
      await sheet.deleteOne()
      res.status(200).json({message: 'Fișa a fost ștearsă cu success, stocul a fost actualizat!'})
    } else{
      res.status(226).json({message: 'Ceva nu a mers bine, fișa nu a fost găsită în baza de date!'})
    }
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.getSheets = async (req, res) => {
    const {loc} = req.query
  try{
    const sheets = await Sheet.find({locatie: loc}).populate({path: 'ings.ing', select: 'name um gestiune'})
    res.status(200).json({sheets: sheets})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


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
        console.log(filterTo)
        const ings = await Ingredient.find(filterTo).populate({path: 'ings.ing'});
        console.log(ings.length)
        const sortedIngs = ings.sort((a, b) => {
          if(a.name && b.name){
            return a.name.localeCompare(b.name)
          }
        })
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
      const {loc} = req.query
      try {
        console.log(loc)
        const date = new Date();
        date.setUTCHours(23, 0, 0, 0);
        const ings = await Ingredient.find({locatie: loc})
        const updatePromises = ings.map(ing => {
          const index = ing.inventary && ing.inventary.length ? ing.inventary.length + 1 : 1;
    
          const entry = {
            index: index,
            day: date,
            qty: ing.qty
          };
    
          return Ingredient.updateOne(
            { _id: ing._id },
            {
              $push: { inventary: entry },
            }
          ).exec();
        });
    
         await Promise.all(updatePromises);
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


    module.exports.getInventary = async (req, res, next) =>{
      try{
        const {inventaryId, loc} = req.query;
        if(inventaryId === 'last'){
          const inventary = await Inventary.findOne({locatie: loc}).sort({ _id: -1 })
            .populate({path: 'ingredients.ing', select: 'price um'})
          res.status(200).json(inventary)
        } else if(inventaryId === "all"){
        
          const inventaries = await Inventary.find({locatie: loc})
            .populate({path: 'ingredients.ing', select: 'price um'})
          res.status(200).json(inventaries)
        } else {
    
          const inventary = await Inventary.findById(inventaryId)
              .populate({path: 'ingredients.ing', select: 'price um'})
          res.status(200).json(inventary)
        }
      } catch(err){
        console.log(err)
        res.status(500).json(err)
      }
    }


    module.exports.updateIngredientQuantity = async (req, res, next) => {
      try{
        const {inventaryId} = req.body
        const inventary = await Inventary.findById(inventaryId).populate({path: 'ingredients.ing', select: 'qty'})
        const updatePromises = inventary.ingredients.map(ing => {
          return Ingredient.updateOne(
            { _id: ing.ing._id },
            { qty: round(ing.faptic - (ing.scriptic - ing.ing.qty))}
          );
        });
          await Promise.all(updatePromises);
          inventary.updated = true
          const updatedInventary = await inventary.save()
          res.status(200).json({ message: "Ingredients Updated", inv: updatedInventary});
      }catch(error){
        console.log(error)
        res.status(500).json(error)
      }
    }
