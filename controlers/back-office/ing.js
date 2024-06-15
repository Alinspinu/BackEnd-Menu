const Ingredient = require('../../models/office/inv-ingredient')
const {round} = require('./../../utils/functions')




module.exports.saveIng = async(req, res, next) => {
    const {ing} = req.body;
    const {loc} = req.body;
    const checkIng = await Ingredient.findOne({name: ing.name, gestiune: ing.gestiune, locatie: loc})
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
        const ings = await Ingredient.find({locatie: loc})
          .select([ '-unloadLog'])
          .populate({path: 'ings.ing', select: '-unloadLog -uploadLog -inventary'});
        const sortedIngs = ings.sort((a, b) => a.name.localeCompare(b.name))
        console.log("ingrediente", sortedIngs.length)
        res.status(200).json(sortedIngs)
      }catch (err) {
        console.log(err)
        res.status(500).json({message: err})
      }
    };

    module.exports.getIngConsumabil = async (req, res, next) => {
      const loc = req.query.loc
      try{
        const ings = await Ingredient.find({locatie: loc, dep: 'consumabil'}).select(['name', 'tvaPrice', 'uploadLog'])
        res.status(200).json(ings)
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }

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
        await Ingredient.findByIdAndUpdate(id, newIng);
        const ing = await Ingredient.findById(id).populate({path: "ings.ing"})
        res.status(200).json({message: `Ingredientul ${ing.name} a fost actualizat cu succes!`, ing: ing})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }

    module.exports.updateStoc = async (req, res, next) => {
    //   const {loc} = req.query
    //   const ings = await Ingredient.find({locatie: loc, gestiune: 'bucatarie', productIngredient: false})
    //   const date = new Date('2024-6-1').setUTCHours(0,0,0,0)
      
    //  let num = 0
    //  for(let ing of ings){
    //   const inv = ing.inventary.find(inv => {
    //     const invDate = new Date(inv.day).setUTCHours(0,0,0,0)
    //     return invDate === date
    //   })
    //   let inn = 0
    //   let out = 0
    //   for (let inLog of ing.uploadLog){
    //     const inDate = new Date(inLog.date).setUTCHours(0,0,0,0)
    //     if(inDate > date){
    //       inn += inLog.qty
    //     }
    //   }
    //   for ( let outLog of ing.unloadLog){
    //     const outDate = new Date(outLog.date)
    //     if(outDate > date) {
    //       out += outLog.qty
    //     }
    //   }
    //   if(inv){
    //     num ++
    //     console.log(ing.name, 'cant inv', inv.faptic, 'cant intrata', inn, 'cantitate vanduta', out, 'qty actuala', inv.faptic + inn - out)
    //     ing.qty = round(inv.faptic + inn - out)
    //     await ing.save()
    //   }
    //  }
    //  console.log(num)
    
      res.status(200).json({messahe: 'all good in the ings world'})
    }


    module.exports.saveInventary = async (req, res, next) => {
      try{
        const {loc} = req.query
        const ings = await Ingredient.find({locatie: loc})
        for(let ing of ings) {
          const date = new Date();
          date.setUTCHours(23, 0, 0, 0, 0);
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

module.exports.saveManualInventary = async (req, res, next) => {
  try{
    const {data} = req.body
    const ing  = await Ingredient.findById(data.ingId)
    ing.inventary.forEach(inv => {
      if(inv.index === data.invIndex){
        inv.faptic = data.qtyInv
      }
    })
    const newIng = await ing.save()
    res.status(200).json({message: 'Inventarul a fost actualizat', ing: newIng})
  } catch(err){
    console.log(err)
    res.status(500).json({message: err.message})
  }
}











