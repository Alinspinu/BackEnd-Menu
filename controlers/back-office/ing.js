const Ingredient = require('../../models/office/inv-ingredient')
const {round, formatedDateToShow} = require('./../../utils/functions')
const Inventary = require('../../models/office/inventary')
const Order = require('../../models/office/product/order')
const DelProd = require('../../models/office/product/deletetProduct')
const ImpSheet = require('../../models/office/imp-sheet')




module.exports.saveIng = async(req, res, next) => {
    const {ing} = req.body;
    const {loc} = req.body;
    const checkIng = await Ingredient.findOne({name: ing.name, gestiune: ing.gestiune, locatie: loc})
    if(checkIng){
      return res.status(226).json({message: "Ingredientul deja exista în baza de date!"})
    } else {
      const newIng = new Ingredient(ing)
      newIng.locatie = loc
      const savedIng =  await newIng.save()
      return res.status(200).json({message: `Ingredientul ${newIng.name} a fost salvat cu succes!`, ing: savedIng})
    }
  }
  
    module.exports.searchIng = async (req, res, next) => {
      const loc = req.query.loc
      const page = parseInt(req.query.page) || 1; // Get page from request, default to 1
      const limit = 600; // Items per page
      const skip = (page - 1) * limit;
      try{  
        const items = await Ingredient.find({locatie: loc}).skip(skip).limit(limit)
          .select([ '-unloadLog', '-uploadLog'])
          .populate({path: 'ings.ing', select: '-unloadLog -uploadLog'})
          .populate({path: 'salePoint', select: 'name'})
          .populate({path: 'gest', select: 'name'})
          .populate({path: 'dept', select: 'name'})
        const totalItems = 1100
        console.log(limit)
        const totalPages = Math.ceil(totalItems / limit);
        res.status(200).json({
          items,
          totalPages,
          currentPage: page,
        })
      }catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({message: err})
      }
    };


    module.exports.getIngUploadLog = async (req, res) => {
      try{ 
        const {id} = req.query
        const ing = await Ingredient.findById(id).select('name um uploadLog')
        res.status(200).json(ing)
      } catch(error) {
        console.log(error)
        res.status(500).json(error)
      }
    }

    module.exports.deleteIngUpLog = async (req, res) => {
      try{
        const {logID, ingID} = req.query
        await Ingredient.findByIdAndUpdate(ingID, {$pull: {uploadLog: {_id: logID}}})
        res.status(200).json({message: 'Logul a șters!'})
      } catch(error){
        console.log(error)
        res.status(500).json(error)
      }
    }


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
        const ing = await Ingredient.findById(id)
          .select([ '-unloadLog', '-uploadLog', '-inventary'])
          .populate({path: "ings.ing", select: '-unloadLog -uploadLog -inventary'})
        res.status(200).json({message: `Ingredientul ${ing.name} a fost actualizat cu succes!`, ing: ing})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }



    module.exports.saveInventary = async (req, res, next) => {
      const {loc} = req.query
      try {
        const date = new Date();
        date.setUTCHours(23, 0, 0, 0, 0);
        const formattedDate = date.toISOString();
        const ings = await Ingredient.find({locatie: loc, productIngredient: false, dep: { $in: ['marfa', 'materie'] }}).select('inventary name gestiune dep um')
        console.log(ings.length)
        const updatePromises = ings.map(ing => {
          let index = 1;
          if (ing.inventary && ing.inventary.length) {
            index += ing.inventary.length;
          } else {
            index = 1;
          }
    
          const entry = {
            index: index,
            day: formattedDate,
            qty: ing.qty
          };
    
          // Use updateOne to update the inventory field only
          return Ingredient.updateOne(
            { _id: ing._id },
            { $push: { inventary: entry } }
          );
        });
    
        const promises = await Promise.all(updatePromises);
        const formatedDate = formatedDateToShow(date)
        res.status(200).json({ message: `Inventarul a fost salvat pentru data de ${formatedDate} pentru ${promises.length} ingrediente`});
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

module.exports.getIng = async (req, res) => {
  const {id} = req.query
  try{
    const ing = await Ingredient.findById(id).populate({path: 'ings.ing', select: 'name um'})
    res.status(200).json(ing)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
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


module.exports.compareScriptic = async (req, res, next) => {
  try{
    let ingredients = []
    let consIngs = []
    let delIngs = []
    const {start, end, loc} = req.body
    const startTime = new Date(start).setUTCHours(0,0,0,0)
    const endTime = new Date(end).setUTCHours(0,0,0,0)
    const eTime = new Date(end).setUTCHours(23,0,0,0)
    const ings = await Ingredient.find({locatie: loc,  productIngredient: false, dep: { $in: ['marfa', 'materie']}}).select('name uploadLog um')
    const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep'})
          .populate({path: 'billProduct.ings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})
          .populate({path: 'billProduct.toppings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})
    const firstInventary = await Inventary.findOne({date: startTime, locatie: loc})
    const lastInventary = await Inventary.findOne({date: endTime, locatie: loc})
    const impSheets = await ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: eTime}})
                              .populate({path: 'ings.ing', select: 'name um ings productIngredient', populate: {path: 'ings.ing', select: 'name um' }})
    const orders = await Order.find({locatie: loc, createdAt: {$gte: startTime, $lte: endTime}}).populate([
      {
        path: 'products.ings.ing', 
        populate: {path: 'ings.ing'}
      },
      {
        path: 'products.toppings.ing', 
        populate: {path: 'ings.ing'}
      }
    ])



    for(const sheet of impSheets){
      for(let ing of sheet.ings){
          if(ing.ing.productIngredient){
              for(let ingg of ing.ing.ings){
                  const index = delIngs.findIndex(i => i.name === ingg.ing.name)
                  if(index !== -1){
                      delIngs[index].qty = round(delIngs[index].qty + ingg.qty)
                  } else {
                      delIngs.push(ingg)
                  }
              }
          } else {
              const index = delIngs.findIndex(i => i.name === ing.ing.name)
              if(index !== -1){
                  delIngs[index].qty = round(delIngs[index].qty + ing.qty)
              } else {
                  delIngs.push(ing)
              }
          }
      }
  }

    if(delProds){
      delProds.forEach(delProduct => {
        const product = delProduct.billProduct
        product.ings.forEach(ing => {
          if(ing.ings && ing.ings.length){
            ing.ings.forEach(ig => {
              const existingIng = delIngs.find(i => i.ing.name === ig.ing.name)
              if(existingIng){
                const updatedIng = {
                  qty: existingIng.qty + ig.qty,
                  ing: existingIng.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
              } else{
                delIngs.push(ig)
              }
            })
          } else{
            if(ing && ing.ing){
              const existingIngredient = delIngs.find(p =>p.ing.name === ing.ing.name);
              if (existingIngredient) {
                const updatedIng = {
                  qty: existingIngredient.qty + ing.qty,
                  ing: existingIngredient.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
              } else {
                delIngs.push(ing);
              }
            }
          }
        })
        product.toppings.forEach(ing => {
          if(ing.ing.ings && ing.ing.ings.length){
            ing.ing.ings.forEach(ig => {
              const existingIng = delIngs.find(i => i.ing.name === ig.ing.name)
              if(existingIng){
                const updatedIng = {
                  qty: existingIng.qty + ig.qty,
                  ing: existingIng.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
              } else{
                delIngs.push(ig)
              }
            })
          } else{
            if(ing && ing.ing){
              const existingIngredient = delIngs.find(p =>p.ing.name === ing.ing.name);
              if (existingIngredient) {
                const updatedIng = {
                  qty: existingIngredient.qty + ing.qty,
                  ing: existingIngredient.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
              } else {
                delIngs.push(ing);
              }
            }
          }
        })
      })
    }
      if(orders){
        orders.forEach(order=> {
          order.products.forEach(product => {
            product.ings.forEach(ing => {
          
              if(ing.ings && ing.ings.length){
                ing.ings.forEach(ig => {
                  const existingIngredient = consIngs.find(p =>p.ing.name === ig.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + ig.qty,
                      ing: existingIngredient.ing
                    }
                    consIngs = consIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
                    // existingIngredient.qty += ig.qty 
                  } else {
                    consIngs.push(ig);
                  }
                })
              } else {
                if(ing && ing.ing){
                  const existingIngredient = consIngs.find(p =>p.ing.name === ing.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + ing.qty,
                      ing: existingIngredient.ing
                    }
                    consIngs = consIngs.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
                  } else {
                    consIngs.push(ing);
                  }
                }
                else {
                }
              }
            })
            if(product.toppings.length){
              product.toppings.forEach(topping=>{
                if(topping.ing.ings.length){
                  topping.ing.ings.forEach(ig => {
                    const existingIngredient = consIngs.find(p =>p.ing.name === ig.ing.name);
                    if (existingIngredient) {
                      const updatedIng = {
                        qty: existingIngredient.qty + ig.qty,
                        ing: existingIngredient.ing
                      }
                        consIngs = consIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
                    } else {
                      consIngs.push(ig);
                    }
                  })
                }
                else{
                  const existingIngredient = consIngs.find(p =>p.ing.name === topping.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + topping.qty,
                      ing: existingIngredient.ing
                    }
                    // if(updatedIng.ing.name === "Lapte Vegetal"){
                    //   console.log(updatedIng.qty)
                    // }
                    consIngs = consIngs.map(p => (p.ing.name === topping.ing.name ? updatedIng : p));
                  } else {
                    const ig = {
                      qty: topping.qty,
                      ing: topping.ing
                    }
                    consIngs.push(ig);
                  }
                }
              })
            }
          })
        })
      } 

      lastInventary.ingredients.forEach(ing => {
        const compareIng = {
          name: ing.name,
          um: ing.um,
          first: 0,
          second: ing.faptic,
          scripticUnload: 0,
          saleUnload: 0,
          gestiune: ing.gestiune,
          depVal: 0,
          dep: ing.dep,
          upload: {
            value: 0,
            entries: []
          },
        }
        const existingIng = ingredients.find(ingr => ingr.name === ing.name )
        if(existingIng){
          existingIng.second += ing.faptic
        } else {
          ingredients.push(compareIng)
        }
      })

  
    firstInventary.ingredients.forEach(ing => {
      const compareIng = {
        name: ing.name,
        um: ing.um,
        first: ing.faptic,
        second: 0,
        scripticUnload: 0,
        saleUnload: 0,
        gestiune: ing.gestiune,
        depVal: 0,
        dep: ing.dep,
        upload: {
          value: 0,
          entries: []
        },

      }
      const existingIng = ingredients.find(ingr => ingr.name === ing.name )
      if(existingIng){
        existingIng.first += ing.faptic
      } else {
        ingredients.push(compareIng)
      }
    })



    ings.forEach(ing => {
      ing.uploadLog.forEach(log => {
        const logDate = new Date(log.date).setUTCHours(0,0,0,0)
        if(logDate >= startTime && logDate <= endTime && log.operation && log.operation.name === 'intrare'){
            const compareIng = ingredients.find(ingr => ingr.name === ing.name)
            if(compareIng) {
              compareIng.upload.value += log.qty
              compareIng.upload.entries.push(log)
            }
        }
      })
    })

    delIngs.forEach(ing => {
      const compareIng = {
        name: ing.ing.name,
        um: ing.ing.um,
        first: 0,
        second: 0,
        scripticUnload: 0,
        saleUnload: 0,
        gestiune: ing.gestiune,
        depVal: ing.qty,
        dep: ing.dep,
        upload: {
          value: 0,
          entries: []
        },
      }
      const existingIng = ingredients.find(ingd => ingd.name === compareIng.name)
      if(existingIng){
        existingIng.depVal += compareIng.depVal
      } else {
        ingredients.push(compareIng)
      }
    })

    consIngs.forEach(ing => {
      const compareIng = {
        name: ing.ing.name,
        um: ing.ing.um,
        first: 0,
        second: 0,
        scripticUnload: 0,
        saleUnload: ing.qty,
        gestiune: ing.gestiune,
        depVal: 0,
        dep: ing.dep,
        upload: {
          value: 0,
          entries: []
        },
      }
      const existingIng = ingredients.find(ingd => ingd.name === compareIng.name)
      if(existingIng){
        existingIng.saleUnload += compareIng.saleUnload
      } else {
        ingredients.push(compareIng)
      }
    })
   
    const compareInv = {
      dateFirst: start,
      dateSecond: end,
      ingredients: ingredients
    }
   
    res.status(200).json({compareInv})
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


const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};


module.exports.updateUploadLog = async(req, res) => {
  try{
    const loc = '655e2e7c5a3d53943c6b7c53'

    const ings = await Ingredient.find({locatie: loc}).select('uploadLog')

    ings.forEach(async (ing) => {
      let newUpload =  []
      let compareArr = []
      ing.uploadLog.forEach(log => {
        const date = new Date(log.date)
        date.setUTCHours(0,0,0,0)
        const logToComp = {
          date: date,
          qty: log.qty,
          operation: log.operation.name,
          details: log.operation.details
        }
        const stringLog = JSON.stringify(logToComp)
        const duplicate = compareArr.find(l => l === stringLog)
        if(!duplicate){
          compareArr.push(stringLog)
          newUpload.push(log)
        } else {
          console.log('Found Duplicates')
        }
      })
      ing.uploadLog = newUpload
      await ing.save()
    })
    res.status(200).json({message: 'All done'})
  } catch(err){
    console.log(err)
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



  module.exports.fixbuBulealaOvi = async(req, res) => {
    const {loc} = req.query
    try{
      // const firstDate = new Date('2024-12-02')
      // const fuckDate = new Date('2024-12-03')
      // firstDate.setUTCHours(23, 0, 0, 0, 0);
      // fuckDate.setUTCHours(23, 0, 0, 0, 0);
      // const ings = await Ingredient.find({locatie: loc, gestiune: 'bar'}).select('inventary name')
  
  
      // for(let ing of ings){
      //   const firstInv = ing.inventary.find(i => new Date(i.day).getTime() === firstDate.getTime())
      //   ing.inventary[ing.inventary.length - 1].faptic = firstInv.faptic
      //   const savedIng = await ing.save()
      //   console.log('inventar salvat pentru ingredientul--', savedIng.name)
      // }
  
      res.status(200).json({message: 'all done'})
  
    } catch(error) {
      console.log(error)
    }
  }
  

