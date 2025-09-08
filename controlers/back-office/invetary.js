
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


// module.exports.compareScriptic = async (req, res, next) => {
//   try{
//     let ingredients = []
//     let consIngs = []
//     let delIngs = []
//     const {firstInvId, secondInvId, loc, point} = req.body
//     const firstInventary = await Inventary.findById(firstInvId).populate({path: 'ingredients.ing', select: 'price'})
//     const lastInventary = await Inventary.findById(secondInvId).populate({path: 'ingredients.ing', select: 'price'})
//     const startTime = new Date(firstInventary.date)
//     const endTime = new Date(lastInventary.date)
   

//     const compInv = await ComparedInventary.findOne({firstInv: firstInventary._id, secondInv: lastInventary._id, locatie: loc, salePoint: point})

//     if(compInv){
//       return res.status(200).json(compInv)
//     }

//     const ings = await Ingredient.find({locatie: loc,  productIngredient: false, salePoint: point}).select('name uploadLog um')
//     const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep', salePoint: point})
//           .populate({path: 'billProduct.ings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})
//           .populate({path: 'billProduct.toppings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})

//     const impSheets = await ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: endTime}, salePoint: point})
//                               .populate({path: 'ings.ing', select: 'name um ings productIngredient price', populate: {path: 'ings.ing', select: 'name um price' }})
//     const orders = await Order.find({locatie: loc, createdAt: {$gte: startTime, $lte: endTime}, salePoint: point}).populate([
//       {
//         path: 'products.ings.ing', 
//         populate: {path: 'ings.ing'}
//       },
//       {
//         path: 'products.toppings.ing', 
//         populate: {path: 'ings.ing'}
//       }
//     ])



//     for(const sheet of impSheets){
//       for(let ing of sheet.ings){
//           if(ing.ing.productIngredient){
//               for(let ingg of ing.ing.ings){
//                   const index = delIngs.findIndex(i => i.ing._id.toString() === ingg.ing._id.toString())
//                   if(index !== -1){
//                       delIngs[index].qty = round(delIngs[index].qty + ingg.qty)
//                   } else {
//                      if(ingg.gestiune.toString() === firstInventary.gestiune.toString() ) {
//                       delIngs.push(ingg)
//                      } 
//                   }
//               }
//           } else {
//               const index = delIngs.findIndex(i => i.ing._id.toString() === ing.ing._id.toString())
//               if(index !== -1){
//                   delIngs[index].qty = round(delIngs[index].qty + ing.qty)
//               } else {
//                 if(ing.gestiune.toString() === firstInventary.gestiune.toString()) {
//                   delIngs.push(ing)
//                 }  
//               }
//           }
//       }
//   }
    
//   delIngs.forEach(i => {
//     if(i.ing.name === 'Oua'){
//       console.log('Ingredinet din fisa', i.qty)
//     }
//   })

//     if(delProds){
//       delProds.forEach(delProduct => {
//         const product = delProduct.billProduct
//         product.ings.forEach(ing => {
//           if(ing.ing.ings && ing.ing.ings.length){
//             ing.ing.ings.forEach(ig => {
//               const existingIng = delIngs.find(i => i.ing._id.toString() === ig.ing._id.toString())
//               if(existingIng){
//                 const updatedIng = {
//                   qty: round(existingIng.qty + (ig.qty * ing.qty)),
//                   ing: existingIng.ing
//                 }
//                 delIngs = delIngs.map(p => (p.ing._id.toString() === ig.ing._id.toString() ? updatedIng : p));
//               } else{
//                 if(ig.gestiune.toString() === firstInventary.gestiune.toString() )  delIngs.push(ig)
//               }
//             })
//           } else{
//             if(ing && ing.ing){
//               const existingIngredient = delIngs.find(p =>p.ing._id.toString() === ing.ing._id.toString());
//               if (existingIngredient) {
//                 const updatedIng = {
//                   qty: existingIngredient.qty + ing.qty,
//                   ing: existingIngredient.ing
//                 }
//                 delIngs = delIngs.map(p => (p.ing._id.toString() === ing.ing._id.toString() ? updatedIng : p));
//               } else {
//                 if(!ing.gestiune){
//                     console.log(ing)
//                     console.log(delProduct)
//                 }
//                 if(ing.gestiune.toString() === firstInventary.gestiune.toString()) delIngs.push(ing);
//               }
//             }
//           }
//         })
//         product.toppings.forEach(ing => {
//           if(ing.ing.ings && ing.ing.ings.length){
//             ing.ing.ings.forEach(ig => {
//               const existingIng = delIngs.find(i => i.ing._id.toString() === ig.ing._id.toString())
//               if(existingIng){
//                 const updatedIng = {
//                   qty: existingIng.qty + round(ig.qty *ing.qty),
//                   ing: existingIng.ing
//                 }
//                 delIngs = delIngs.map(p => (p.ing._id.toString() === ig.ing._id.toString() ? updatedIng : p));
//               } else{
//                 if(ig.gestiune.toString() === firstInventary.gestiune.toString() )  delIngs.push(ig)
//               }
//             })
//           } else{
//             if(ing && ing.ing){
//               const existingIngredient = delIngs.find(p =>p.ing._id.toString() === ing.ing._id.toString());
//               if (existingIngredient) {
//                 const updatedIng = {
//                   qty: existingIngredient.qty + ing.qty,
//                   ing: existingIngredient.ing
//                 }
//                 delIngs = delIngs.map(p => (p.ing._id.toString() === ing.ing._id.toString() ? updatedIng : p));
//               } else {
//                 if(ing.gestiune.toString() === firstInventary.gestiune.toString() )  delIngs.push(ing);
//               }
//             }
//           }
//         })
//       })
//     }

//     delIngs.forEach(i => {
//       if(i.ing.name === 'Oua'){
//         console.log('Ingredinet din fisa si produse sterse', i.qty)
//       }
//     })

//       if(orders){
//         orders.forEach(order=> {
//           order.products.forEach(product => {
//             product.ings.forEach(ing => {
//               ing.qty = round(ing.qty*product.quantity)
//               if(ing.ing.ings && ing.ing.ings.length){
//                 ing.ing.ings.forEach(ig => {
//                   const existingIngredient = consIngs.find(p =>p.ing?._id.toString() === ig.ing?._id.toString());
//                   if (existingIngredient) {
//                     const updatedIng = {
//                       qty: existingIngredient.qty + round(ig.qty * ing.qty), 
//                       ing: existingIngredient.ing
//                     }
//                     consIngs = consIngs.map(p => (p.ing?._id.toString() === ig.ing._id.toString() ? updatedIng : p));
//                   } else {
//                       if(ig.gestiune.toString() === firstInventary.gestiune.toString() ) consIngs.push(ig);
                      
//                     if(ig.gestiune){
//                     } else {console.log(ing.ing)}
//                   }
//                 })
//               } else {
//                 if(ing && ing.ing){
//                   const existingIngredient = consIngs.find(p =>p.ing?._id.toString() === ing.ing._id.toString());
//                   if (existingIngredient) {
//                     const updatedIng = {
//                       qty: existingIngredient.qty + ing.qty,
//                       ing: existingIngredient.ing
//                     }
//                     consIngs = consIngs.map(p => (p.ing?._id.toString() === ing.ing._id.toString() ? updatedIng : p));
//                   } else {
//                     if(ing.gestiune.toString() === firstInventary.gestiune.toString()) consIngs.push(ing);
//                   }
//                 }
//                 else {
//                   console.log(ing)
//                 }
//               }
//             })
//             if(product.toppings.length){
//               product.toppings.forEach(topping=>{
//                 topping.qty = round(topping.qty * product.quantity)
//                 if(topping.ing?.ings.length){
//                   topping.ing.ings.forEach(ig => {
//                     const existingIngredient = consIngs.find(p =>p.ing?._id.toString() === ig.ing?._id.toString());
//                     if (existingIngredient) {
//                       const updatedIng = {
//                         qty: existingIngredient.qty + round(ig.qty * topping.qty),
//                         ing: existingIngredient.ing
//                       }
//                         consIngs = consIngs.map(p => (p.ing?._id.toString() === ig.ing?._id.toString() ? updatedIng : p));
//                     } else {
//                         if(ig.gestiune.toString() === firstInventary.gestiune.toString() ) consIngs.push(ig);
//                     }
//                   })
//                 }
//                 else{
//                   const existingIngredient = consIngs.find(p =>p.ing?._id.toString() === topping.ing?._id.toString());
//                   if (existingIngredient) {
//                     existingIngredient.qty = round(existingIngredient.qty + topping.qty)
//                     const updatedIng = {
//                       qty: existingIngredient.qty + topping.qty,
//                       ing: existingIngredient.ing
//                     }
//                     // if(updatedIng.ing.name === "Lapte Vegetal"){
//                     //   console.log(updatedIng.qty)
//                     // }
//                     consIngs = consIngs.map(p => (p.ing?._id.toString() === topping.ing?._id.toString() ? updatedIng : p));
//                   } else {
//                     const ig = {
//                       qty: topping.qty,
//                       ing: topping.ing
//                     }
//                     if(topping.gestiune.toString() === firstInventary.gestiune.toString())  consIngs.push(ig);
//                   }
//                 }
//               })
//             }
//           })
//         })
//       } 

//       lastInventary.ingredients.forEach(ing => {
//         const compareIng = {
//           name: ing.name,
//           um: ing.um,
//           first: 0,
//           second: ing.faptic,
//           scripticUnload: 0,
//           saleUnload: 0,
//           depVal: 0,
//           price: ing.ing?.price || 0,
//           dep: ing.dep,
//           upload: {
//             value: 0,
//             entries: []
//           },
//         }
//         const existingIng = ingredients.find(ingr => ingr.name === ing.name )
//         if(existingIng){
//           existingIng.second += ing.faptic
//         } else {
//           ingredients.push(compareIng)
//         }
//       })

  
//     firstInventary.ingredients.forEach(ing => {
//       const compareIng = {
//         name: ing.name,
//         um: ing.um,
//         first: ing.faptic,
//         second: 0,
//         scripticUnload: 0,
//         saleUnload: 0,
//         depVal: 0,
//         price: ing.ing?.price || 0,
//         dep: ing.dep,
//         upload: {
//           value: 0,
//           entries: []
//         },

//       }
//       const existingIng = ingredients.find(ingr => ingr.name === ing.name )
//       if(existingIng){
//         existingIng.first += ing.faptic
//       } else {
//         ingredients.push(compareIng)
//       }
//     })





//     delIngs.forEach(ing => {
//       const compareIng = {
//         name: ing.ing?.name,
//         um: ing.ing?.um,
//         first: 0,
//         second: 0,
//         scripticUnload: 0,
//         saleUnload: 0,
//         depVal: ing.qty,
//         price: ing.ing?.price || 0,
//         dep: ing.dep,
//         upload: {
//           value: 0,
//           entries: []
//         },
//       }
//       const existingIng = ingredients.find(ingd => ingd.name === compareIng.name)
//       if(existingIng){
//         existingIng.depVal += compareIng.depVal
//       } else {
//         ingredients.push(compareIng)
//       }
//     })

//     consIngs.forEach(ing => {
//       const compareIng = {
//         name: ing.ing?.name,
//         um: ing.ing?.um,
//         first: 0,
//         second: 0,
//         scripticUnload: 0,
//         saleUnload: ing.qty | 0,
//         depVal: 0,
//         price: ing.ing?.price || 0,
//         dep: ing.dep,
//         upload: {
//           value: 0,
//           entries: []
//         },
//       }
//       const existingIng = ingredients.find(ingd => ingd.name === compareIng.name)
//       if(existingIng){
//         existingIng.saleUnload += compareIng.saleUnload
//       } else {
//         ingredients.push(compareIng)
//       }
//     })

//     ings.forEach(ing => {
//       ing.uploadLog.forEach(log => {
//         const logDate = new Date(log.date).setUTCHours(0,0,0,0)
//         if(logDate >= startTime && logDate <= endTime && log.operation && log.operation.name === 'intrare'){
//             const compareIng = ingredients.find(ingr => ingr.name === ing.name)
//             if(compareIng) {
//               compareIng.upload.value += log.qty
//               compareIng.upload.entries.push(log)
//             }
//         }
//       })
//     })
   
//     const compareInv = {
//       dateFirst: firstInventary.date,
//       dateSecond: lastInventary.date,
//       ingredients: ingredients,
//       firstInv: firstInventary._id,
//       secondInv: lastInventary._id,
//       locatie: loc,
//       salePoint: point,
//       gestiune: firstInventary.gestiune
//     }
//     console.log('Gest ', firstInventary.gestiune)
//     console.log('GESTIUNE ', compareInv.gestiune)
//     const newCompare = new ComparedInventary(compareInv)
//     const savedCompare = await newCompare.save()
//     await savedCompare.populate({ path: 'gestiune', select: 'name' });
//     res.status(200).json({message: 'Invetaul comparat a fost generat cu success!', inv: savedCompare})
//   } catch(err){
//     console.log(err)
//     res.status(500).json(err)
//   }

// }



module.exports.compareScriptic = async (req, res) => {
  try {
    const { firstInvId, secondInvId, loc, point } = req.body;

    // 1) Load the two inventories
    const [firstInventary, lastInventary] = await Promise.all([
      Inventary.findById(firstInvId).populate({ path: 'ingredients.ing', select: 'price name um' }),
      Inventary.findById(secondInvId).populate({ path: 'ingredients.ing', select: 'price name um' }),
    ]);
    if (!firstInventary || !lastInventary) {
      return res.status(404).json({ message: 'Inventar(ul) nu a fost găsit.' });
    }

    const startTime = new Date(firstInventary.date);
    const endTime   = new Date(lastInventary.date);

    // already compared?
    const existing = await ComparedInventary.findOne({
      firstInv: firstInventary._id,
      secondInv: lastInventary._id,
      locatie: loc,
      salePoint: point,
    });
    if (existing) return res.status(200).json(existing);

    // 2) Load the rest in parallel
    const [ings, delProds, impSheets, orders] = await Promise.all([
      Ingredient.find({ locatie: loc, productIngredient: false, salePoint: point }).select('name uploadLog um'),
      DelProd.find({
        locatie: loc,
        createdAt: { $gte: startTime, $lt: endTime },
        reason: 'dep',
        salePoint: point,
      })
        .populate({ path: 'billProduct.ings.ing', select: 'name ings um', populate: { path: 'ings.ing', select: 'name um' } })
        .populate({ path: 'billProduct.toppings.ing', select: 'name ings um', populate: { path: 'ings.ing', select: 'name um' } }),
      ImpSheet.find({ locatie: loc, date: { $gte: startTime, $lte: endTime }, salePoint: point })
        .populate({ path: 'ings.ing', select: 'name um ings productIngredient price', populate: { path: 'ings.ing', select: 'name um price' } }),
      Order.find({ locatie: loc, createdAt: { $gte: startTime, $lte: endTime }, salePoint: point })
        .populate([
          { path: 'products.ings.ing',     populate: { path: 'ings.ing' } },
          { path: 'products.toppings.ing', populate: { path: 'ings.ing' } },
        ]),
    ]);

    // === helpers ============================================================
    const r = (n) => round(n); // or roundd
    const idStr = (x) => (x?._id ? x._id.toString() : String(x));
    const sameId = (a, b) => a && b && idStr(a) === idStr(b);
    // const gestMatch = (wrap) => wrap?.gestiune && sameId(wrap.gestiune, firstInventary.gestiune);

    const gestMatch = (w) =>
      !w?.gestiune || sameId(w.gestiune, firstInventary.gestiune);
    // fast accumulators by _id
    const depMap  = new Map(); // deletions / sheets → depVal
    const consMap = new Map(); // orders consumption → saleUnload

    function addTo(map, ingDoc, qty) {
      if (!ingDoc?._id) return;
      const key = idStr(ingDoc._id);
      const prev = map.get(key);
      if (prev) prev.qty = r(prev.qty + qty);
      else map.set(key, { qty: r(qty), ing: ingDoc });
    }

    function processLeaf(map, w, mult = 1) {
      if (!w?.ing?._id || !gestMatch(w)) return;
      const qty = r((w.qty || 0) * (mult || 1));
      if (qty) addTo(map, w.ing, qty);
    }

    function processComposite(map, w, mult = 1) {
      if (!w?.ing?.ings?.length) return;
      for (const sub of w.ing.ings) {
        if (!sub?.ing?._id || !gestMatch(sub)) continue;
        const qty = r((sub.qty || 0) * (w.qty || 0) * (mult || 1));
        if (qty) addTo(map, sub.ing, qty);
      }
    }

    // === 3) impSheets -> depMap
    for (const sheet of impSheets) {
      for (const w of sheet.ings) {
        if (w?.ing?.productIngredient) processComposite(depMap, w, 1);
        else processLeaf(depMap, w, 1);
      }
    }

    // === 4) delProds -> depMap
    for (const dp of delProds || []) {
      const bp = dp.billProduct; if (!bp) continue;
      for (const w of bp.ings || []) {
        if (w?.ing?.ings?.length) {
          for (const sub of w.ing.ings) {
            if (!sub?.ing?._id || !gestMatch(sub)) continue;
            const qty = r((sub.qty || 0) * (w.qty || 0));
            if (qty) addTo(depMap, sub.ing, qty);
          }
        } else processLeaf(depMap, w, 1);
      }
      for (const w of bp.toppings || []) {
        if (w?.ing?.ings?.length) {
          for (const sub of w.ing.ings) {
            if (!sub?.ing?._id || !gestMatch(sub)) continue;
            const qty = r((sub.qty || 0) * (w.qty || 0));
            if (qty) addTo(depMap, sub.ing, qty);
          }
        } else processLeaf(depMap, w, 1);
      }
    }
    // === 5) orders -> consMap
    for (const order of orders || []) {
      for (const prod of order.products || []) {
        const mult = r(prod.quantity || 0);

        for (const w of prod.ings || []) {
          if(!w.ing){
            console.log('Lipsa ingredient',w)
          }
          const scaled = { ...w, qty: r((w.qty || 0) * mult) };
          console.log(scaled)
          if(scaled.ing?.name === 'Oua'){
            console.log(scaled.gestiune)
          }
          // console.log(w)
          if (scaled?.ing?.ings?.length) {
            for (const sub of scaled.ing.ings) {
              if (!sub?.ing?._id || !gestMatch(sub)) continue;
              const qty = r((sub.qty || 0) * (scaled.qty || 0));
              if (qty) addTo(consMap, sub.ing, qty);
            }
          } else processLeaf(consMap, scaled, 1);
        }

        for (const t of prod.toppings || []) {
          const scaled = { ...t, qty: r((t.qty || 0) * mult) };
          if (scaled?.ing?.ings?.length) {
            for (const sub of scaled.ing.ings) {
              if (!sub?.ing?._id || !gestMatch(sub)) continue;
              const qty = r((sub.qty || 0) * (scaled.qty || 0));
              if (qty) addTo(consMap, sub.ing, qty);
            }
          } else processLeaf(consMap, scaled, 1);
        }
      }
    }

    // === 6) Build final "ingredients" BY ID =================================
    // compareMap: key = ingredient _id (string)
    const compareMap = new Map(); // value shape below

    function upsertById(ingDoc, mut) {
      if (!ingDoc?._id) return;
      const key = idStr(ingDoc._id);
      let obj = compareMap.get(key);
      if (!obj) {
        obj = {
          _id: ingDoc._id,
          name: ingDoc.name || '',
          um: ingDoc.um || '',
          first: 0,
          second: 0,
          scripticUnload: 0,
          saleUnload: 0,
          depVal: 0,
          price: ingDoc.price || 0,
          dep: undefined,
          upload: { value: 0, entries: [] },
        };
        compareMap.set(key, obj);
      }
      mut(obj);
    }

    // first inventory → "first"
    for (const it of firstInventary?.ingredients || []) {
      const ingDoc = it.ing || { _id: undefined, name: it.name, um: it.um, price: it.ing?.price };
      upsertById(ingDoc, (ci) => {
        ci.name  = ci.name || it.name;
        ci.um    = ci.um   || it.um;
        ci.first = r(ci.first + (it.faptic || 0));
        ci.price = ingDoc.price ?? ci.price ?? 0;
        ci.dep ??= it.dep;
      });
    }

    // last inventory → "second"
    for (const it of lastInventary?.ingredients || []) {
      const ingDoc = it.ing || { _id: undefined, name: it.name, um: it.um, price: it.ing?.price };
      upsertById(ingDoc, (ci) => {
        ci.name   = ci.name || it.name;
        ci.um     = ci.um   || it.um;
        ci.second = r(ci.second + (it.faptic || 0));
        ci.price  = ingDoc.price ?? ci.price ?? 0;
        ci.dep   ??= it.dep;
      });
    }

    // depMap → depVal
    for (const { qty, ing } of depMap.values()) {
      upsertById(ing, (ci) => {
        ci.depVal = r(ci.depVal + (qty || 0));
        ci.um   = ci.um || ing?.um || '';
        ci.name = ci.name || ing?.name || '';
        ci.price = ing?.price ?? ci.price ?? 0;
      });
    }

    // consMap → saleUnload
    for (const { qty, ing } of consMap.values()) {
      upsertById(ing, (ci) => {
        ci.saleUnload = r(ci.saleUnload + (qty || 0));
        ci.um   = ci.um || ing?.um || '';
        ci.name = ci.name || ing?.name || '';
        ci.price = ing?.price ?? ci.price ?? 0;
      });
    }

    // uploads (by ingredient _id)
    // Build a quick lookup of compare objects by ingredient name too (only for fallback),
    // but prefer _id matches from the Ingredient list.
    const compareById = (id) => (id ? compareMap.get(idStr(id)) : undefined);

    for (const ingDoc of ings || []) {
      const comp = compareById(ingDoc._id);
      if (!comp) continue; // if it never appeared elsewhere, skip uploads

      for (const log of ingDoc.uploadLog || []) {
        const d = new Date(log.date);
        // compare by day (UTC 00:00)
        const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        if (t >= startTime.getTime() && t <= endTime.getTime() && log.operation?.name === 'intrare') {
          comp.upload.value = r(comp.upload.value + (log.qty || 0));
          comp.upload.entries.push(log);
        }
      }
    }

    // materialize to array
    const ingredients = Array.from(compareMap.values());

    // === 7) Save
    const savedCompare = await new ComparedInventary({
      dateFirst: firstInventary.date,
      dateSecond: lastInventary.date,
      ingredients,
      firstInv: firstInventary._id,
      secondInv: lastInventary._id,
      locatie: loc,
      salePoint: point,
      gestiune: firstInventary.gestiune,
    }).save();

    await savedCompare.populate({ path: 'gestiune', select: 'name' });
    res.status(200).json({ message: 'Inventarul comparat a fost generat cu succes!', inv: savedCompare });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};



















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
  
  


 
