
const Ingredient = require('../../models/office/inv-ingredient');
const Inventary = require('../../models/office/inventary');
const ComparedInventary = require('../../models/office/comp-inv');
const DelProd = require('../../models/office/product/deletetProduct')
const Order = require('../../models/office/product/order')
const ImpSheet = require('../../models/office/imp-sheet')


const io = require('socket.io-client');
const socket = io("https://socket.flowmanager.ro")
const {round} = require('../../utils/functions')



module.exports.createInventary = async (req, res, next) => {
  try{
    const {date, loc, point, gestiune} = req.body
    const invDate = new Date(date).setUTCHours(20,59,59,0)
    const ings = await Ingredient.find({locatie: loc, 'invGestiune.gestiune': gestiune, salePoint: point})
                    .select('name  dept um invGestiune')
                    .populate({path: 'dept', select:'name'})
                    .populate({path: 'invGestiune.gestiune', select: 'name'})
        
        let scripticValue = 0
        const mapIngredients =  ings.map(i => {
            const gest = i.invGestiune.find(g => g.gestiune._id.toString() === gestiune)
            if(gest){          
                for(let e of gest.entries){
                    scripticValue += (e.priceWithVat * e.qty)
                }
                const ing = {
                    ing: i._id,
                    name: i.name,
                    faptic: 0,
                    scriptic: gest.qty,
                    dep: i.dept.name,
                    um: i.um
                }
              return ing
            } else {
                console.log('Nu am gasit gestiune pe ingredient ', i.name)
                return undefined
            }
        }).filter(Boolean)

        const sortedIngredients = mapIngredients.sort((a,b) => b.name.localeCompare(a.name) )
        const inv = new Inventary({
          locatie: loc,
          salePoint: point,
          date: invDate,
          gestiune: gestiune,
          ingredients: sortedIngredients,
          scripticValue: round(scripticValue),
          updated: false
        })
        const savedInv = await inv.save()
        await savedInv.populate([
            { path: 'ingredients.ing', select: 'price um' },
            { path: 'gestiune', select: 'name' }
          ]);
        res.status(200).json({message: 'Inventarul a fost salvat!', inv: savedInv})
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }
}


module.exports.updateInventary = async (req, res) => {
    const {invId, ingId, value} = req.body
    try{

        const inventary = await Inventary.findById(invId)
        if(inventary.updated){
            return res.status(401).json({ message: 'Inventarul a fost folosit la actualizarea gestiunii, prin urmare nu poate fi modificat!' });
        }

        const dbIng  = await Ingredient.findById(ingId)
       
        const ing = inventary.ingredients.find(i => i.ing.toString() === ingId)
        if(ing){
            for(let g of  dbIng.invGestiune){
                if(g.gestiune.toString() === inventary.gestiune.toString()){
                    inventary.fapticValue = round(inventary.fapticValue - allocateFromNewest(g.entries, ing.faptic).totalCost)
                    inventary.fapticValue = round(inventary.fapticValue + allocateFromNewest(g.entries, value).totalCost)
                }
            }

            ing.faptic = value
        }
        const savedInv = await inventary.save()
        await savedInv.populate([
            { path: 'ingredients.ing', select: 'price um inventary' },
            { path: 'gestiune', select: 'name' }
          ]);

        socket.emit('inventary', JSON.stringify({inv: savedInv}))

        res.status(200).json({message: 'Inventarul a fost actualizat cu success! ', inv: savedInv})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

 
 module.exports.getInventary = async (req, res) =>{
   try{
     const {inventaryId, loc, point} = req.query;
     if(inventaryId === "all"){
       const inventaries = await Inventary.find({locatie: loc, salePoint: point})
                            .select('-ingredients')
                            .populate({path: 'gestiune', select: 'name'})
       res.status(200).json(inventaries)
     } else {
       const inventary = await Inventary.findById(inventaryId)
                        .populate([
                            { path: 'ingredients.ing', select: 'price um inventary' },
                            { path: 'gestiune', select: 'name' }
                        ]);
       res.status(200).json(inventary)
     }
   } catch(err){
     console.log(err)
     res.status(500).json(err)
   }
 }


 module.exports.deleteInventary = async(req, res) => {
    const {invId} = req.query
    try{
        const inv = await Inventary.findById(invId)
        if (!inv) {
            return res.status(404).json({ message: 'Inventarul nu a fost găsit!' });
          }
          
          if (inv.updated) {
            return res.status(401).json({ message: 'Inventarul a fost folosit la actualizarea gestiunii, prin urmare nu poate fi șters!' });
          }
          
          await inv.deleteOne();
          return res.status(200).json({ message: 'Inventarul a fost șters cu succes!' });
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
 }


 module.exports.updateGestiune = async (req, res) =>{
   try{
    const {id} = req.body

    const inventary = await Inventary.findById(id)

    const promises = inventary.ingredients.map(async (i) => {
        const dbIng = await Ingredient.findById(i.ing)
        if(dbIng){
            const ingGest = dbIng.invGestiune.find(g => g.gestiune.toString() === inventary.gestiune.toString())
            if(ingGest){
                ingGest.qty = round(ingGest.qty - (i.scriptic - i.faptic))
                if(ingGest.entries.length){
                    const entries = allocateFromNewest(ingGest.entries, ingGest.qty).allocations
                    ingGest.entries = entries
                } else {
                    const entry = {
                        qty: ingGest.qty,
                        date: inventary.date,
                        priceNoVat: dbIng.price,
                        priceWithVat: round(dbIng.price * (1 + dbIng.tva / 100)),
                        inQty: i.faptic,
                        suplierName: 'Intrare din inventar'
                    }
                    ingGest.entries.push(entry)
                }
            }
            dbIng.qty = round((dbIng.invGestiune ?? []).reduce((sum, g) => sum + (Number(g.qty) || 0), 0))
         return dbIng.save().then(i => {
            console.log(`Ingredientul ${i.name} a fost actulizat cu succees!`)
            console.log('Cantitate totala ', i.qty)
         })
        }
    })

    await Promise.all(promises)

    res.status(200).json({message: 'Gestiunea a fost modificată după inventar!'})
   } catch(err){
     console.log(err)
     res.status(500).json(err)
   }
 }


module.exports.getComaredInv = async (req, res) => {

    try{
        const {point, loc, id} = req.query
        if(id){
          const compInv =  await ComparedInventary.findById(id).populate({path: 'gestiune', select: 'name'})
            res.status(200).json(compInv)
        } else {
            const compareInv = await ComparedInventary.find({locatie: loc, salePoint: point}).populate({path: 'gestiune', select: 'name'})
            res.status(200).json(compareInv)
        }
    } catch(error){
        consol.log(error)
        res.status(500).json('Eroare la descacarea inventar compus', error)
    }
}


module.exports.deleteCompare = async (req, res) => {
    try{
        const {id} = req.query
        await ComparedInventary.findByIdAndDelete(id)
        res.status(200).json({message: 'Inventarul comparat a fost șters cu sucess!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.compareScriptic = async (req, res, next) => {
  try{
    let ingredients = []
    let consIngs = []
    let delIngs = []
    const {firstInvId, secondInvId, loc, point} = req.body
    const firstInventary = await Inventary.findById(firstInvId).populate({path: 'ingredients.ing', select: 'price'})
    const lastInventary = await Inventary.findById(secondInvId).populate({path: 'ingredients.ing', select: 'price'})
    const startTime = new Date(firstInventary.date)
    const endTime = new Date(lastInventary.date)
   

    const compInv = await ComparedInventary.findOne({firstInv: firstInventary._id, secondInv: lastInventary._id, locatie: loc, salePoint: point})

    if(compInv){
      return res.status(200).json(compInv)
    }

    const ings = await Ingredient.find({locatie: loc,  productIngredient: false, salePoint: point}).select('name uploadLog um')
    const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep', salePoint: point})
          .populate({path: 'billProduct.ings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})
          .populate({path: 'billProduct.toppings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})

    const impSheets = await ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: endTime}, salePoint: point})
                              .populate({path: 'ings.ing', select: 'name um ings productIngredient price', populate: {path: 'ings.ing', select: 'name um price' }})
    const orders = await Order.find({locatie: loc, createdAt: {$gte: startTime, $lte: endTime}, salePoint: point}).populate([
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
                     if(ingg.gestiune.toString() === firstInventary.gestiune.toString() ) {
                      delIngs.push(ingg)
                     } 
                  }
              }
          } else {
              const index = delIngs.findIndex(i => i.name === ing.ing.name)
              if(index !== -1){
                if(ing.ing.name === 'Oua'){
                  console.log(ing.qty)
                }
                  delIngs[index].qty = round(delIngs[index].qty + ing.qty)
              } else {
                if(ing.gestiune.toString() === firstInventary.gestiune.toString()) {
                  delIngs.push(ing)
                }  
              }
          }
      }
  }

    if(delProds){
      delProds.forEach(delProduct => {
        const product = delProduct.billProduct
        product.ings.forEach(ing => {
          if(ing.ing.ings && ing.ing.ings.length){
            ing.ing.ings.forEach(ig => {
              const existingIng = delIngs.find(i => i.ing.name === ig.ing.name)
              if(existingIng){
                const updatedIng = {
                  qty: round(existingIng.qty + (ig.qty * ing.qty)),
                  ing: existingIng.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
              } else{
                if(ig.gestiune.toString() === firstInventary.gestiune.toString() )  delIngs.push(ig)
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
                if(!ing.gestiune){
                    console.log(ing)
                    console.log(delProduct)
                }
                if(ing.gestiune.toString() === firstInventary.gestiune.toString()) delIngs.push(ing);
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
                  qty: existingIng.qty + round(ig.qty *ing.qty),
                  ing: existingIng.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
              } else{
                if(ig.gestiune.toString() === firstInventary.gestiune.toString() )  delIngs.push(ig)
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
                if(ing.gestiune.toString() === firstInventary.gestiune.toString() )  delIngs.push(ing);
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
              ing.qty = round(ing.qty*product.quantity)
              if(ing.ing.ings && ing.ing.ings.length){
                ing.ing.ings.forEach(ig => {
                  const existingIngredient = consIngs.find(p =>p.ing?.name === ig.ing?.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + round(ig.qty * ing.qty), 
                      ing: existingIngredient.ing
                    }
                    consIngs = consIngs.map(p => (p.ing?.name === ig.ing.name ? updatedIng : p));
                  } else {
                      if(ig.gestiune.toString() === firstInventary.gestiune.toString() ) consIngs.push(ig);
                      
                    if(ig.gestiune){
                    } else {console.log(ing.ing)}
                  }
                })
              } else {
                if(ing && ing.ing){
                  const existingIngredient = consIngs.find(p =>p.ing?.name === ing.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + ing.qty,
                      ing: existingIngredient.ing
                    }
                    consIngs = consIngs.map(p => (p.ing?.name === ing.ing.name ? updatedIng : p));
                  } else {
                    if(ing.gestiune.toString() === firstInventary.gestiune.toString()) consIngs.push(ing);
                  }
                }
                else {
                  console.log(ing)
                }
              }
            })
            if(product.toppings.length){
              product.toppings.forEach(topping=>{
                topping.qty = round(topping.qty * product.quantity)
                if(topping.ing?.ings.length){
                  topping.ing.ings.forEach(ig => {
                    const existingIngredient = consIngs.find(p =>p.ing?.name === ig.ing?.name);
                    if (existingIngredient) {
                      const updatedIng = {
                        qty: existingIngredient.qty + round(ig.qty * topping.qty),
                        ing: existingIngredient.ing
                      }
                        consIngs = consIngs.map(p => (p.ing?.name === ig.ing?.name ? updatedIng : p));
                    } else {
                        if(ig.gestiune.toString() === firstInventary.gestiune.toString() ) consIngs.push(ig);
                    }
                  })
                }
                else{
                  const existingIngredient = consIngs.find(p =>p.ing?.name === topping.ing?.name);
                  if (existingIngredient) {
                    existingIngredient.qty = round(existingIngredient.qty + topping.qty)
                    const updatedIng = {
                      qty: existingIngredient.qty + topping.qty,
                      ing: existingIngredient.ing
                    }
                    // if(updatedIng.ing.name === "Lapte Vegetal"){
                    //   console.log(updatedIng.qty)
                    // }
                    consIngs = consIngs.map(p => (p.ing?.name === topping.ing?.name ? updatedIng : p));
                  } else {
                    const ig = {
                      qty: topping.qty,
                      ing: topping.ing
                    }
                    if(topping.gestiune.toString() === firstInventary.gestiune.toString())  consIngs.push(ig);
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
          depVal: 0,
          price: ing.ing?.price || 0,
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
        depVal: 0,
        price: ing.ing?.price || 0,
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





    delIngs.forEach(ing => {
      if(ing.ing.name === 'Oua'){
        console.log(ing)
      }
      const compareIng = {
        _id: ing.ing?._id,
        name: ing.ing?.name,
        um: ing.ing?.um,
        first: 0,
        second: 0,
        scripticUnload: 0,
        saleUnload: 0,
        depVal: ing.qty,
        price: ing.ing?.price || 0,
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
        _id: ing.ing?._id,
        name: ing.ing?.name,
        um: ing.ing?.um,
        first: 0,
        second: 0,
        scripticUnload: 0,
        saleUnload: ing.qty | 0,
        depVal: 0,
        price: ing.ing?.price || 0,
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
   
    const compareInv = {
      dateFirst: firstInventary.date,
      dateSecond: lastInventary.date,
      ingredients: ingredients,
      firstInv: firstInventary._id,
      secondInv: lastInventary._id,
      locatie: loc,
      salePoint: point,
      gestiune: firstInventary.gestiune
    }
    console.log('Gest ', firstInventary.gestiune)
    console.log('GESTIUNE ', compareInv.gestiune)
    const newCompare = new ComparedInventary(compareInv)
    const savedCompare = await newCompare.save()
    await savedCompare.populate({ path: 'gestiune', select: 'name' });
    res.status(200).json({message: 'Invetaul comparat a fost generat cu success!', inv: savedCompare})
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }

}


















function allocateFromNewest(entries, globalQty) {
    if (!Array.isArray(entries) || globalQty <= 0) {
      return 0;
    }
    // Sort by date: newest first
    const sorted = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ); 
    let remaining = globalQty;
    const allocations = [];
    for (const e of sorted) {
      if (remaining <= 0) break;
      const useQty = Math.min(remaining, Number(e.qty) || 0);
      if (useQty > 0) {
        allocations.push({
          priceWithVat: Number(e.priceWithVat) || 0,
          priceNoVat: Number(e.priceNovat) || 0,
          inQty: Number(e.inQty) || 0,
          suplierName: e.suplierName,
          nir: e.nir,
          qty: useQty,
          date: new Date(e.date)
        });
        remaining -= useQty;
      }
    }
    // If still remaining, price it using the oldest entry's price
    if (remaining > 0 && allocations.length > 0) {
      const oldest = allocations[allocations.length - 1];
      oldest.qty = round(oldest.qty + remaining)
      remaining = 0;
    }
  
    const totalCost = allocations.reduce((sum, a) => sum + a.priceWithVat * a.qty, 0);  
    return {totalCost, allocations};
  }
  
  


 
