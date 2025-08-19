const IngInv = require('../models/office/inv-ingredient')
const {round} = require('./functions')

const Product = require('../models/office/product/product')
const SubProduct = require('../models/office/product/sub-product')


const norm = s => s?.trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const veggie = ['lapte vegetal', 'lapte mazare', 'lapte ovaz' ]

async function unloadIngs (ings, qtyProdus) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).exec();
        if (!ingredientInv) {
            console.log(`Eorare! Ingredientul nu a fost găsit în baza de date. la descarcare de stoc`);
        } else {
          if(ingredientInv.ings.length){
            ingredientInv.ings.forEach(obj => {
              obj.qty = round(obj.qty * ing.qty)
            })
            await unloadIngs(ingredientInv.ings, qtyProdus)
          } else {
            let cantFinal = parseFloat(ing.qty * qtyProdus);
            ingredientInv.qty  = round(ingredientInv.qty - cantFinal);

            if(ingredientInv.invGestiune.length){
              const gestIndex = ingredientInv.invGestiune.findIndex(g => g.gestiune.toString() === ing.gestiune.toString())
              if(gestIndex !== -1){
                const gest = ingredientInv.invGestiune[gestIndex];
                console.log('Procesare.... ', ingredientInv.name)
                gest.qty = round(gest.qty - cantFinal);
                console.log(gest.entries)
                gest.entries = subtractFromEntries(gest.entries, cantFinal);


                ingredientInv.invGestiune[gestIndex] = gest
              }  else {console.log('Au fost gasite gestiuni dar nu a fost gasta gestiune ingredientului ', ing.gestiune)}
            } else {console.log('Nu au fost gasite gestiuni de inventar')}

            await ingredientInv.save();
            console.log(`Success!! unload-ingredient: Nume - ${ingredientInv.name} - ${cantFinal} / stoc: ${ingredientInv.qty}`)
          }
            if(veggie.includes(norm(ingredientInv.name))){
              const lapte = await IngInv.findOne({name: "Lapte", locatie: ingredientInv.locatie, salePoint: ingredientInv.salePoint})
              const ingTo = {
                qty: ing.qty,
                ing: lapte._id
              }
              await uploadIngs([ingTo],  qtyProdus)
            }
        }

      }
  } catch(err){
    console.log("Eroare la descarcarea prooduselor din inventar",err)
  }
}


async function uploadIngs (ings, qtyProdus) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).exec();
        if (!ingredientInv) {
            console.log(`Eorare! Ingredientul nu a fost găsit în baza de date. la incarcare de stoc`);
          } else {
            if(ingredientInv.ings.length){
              ingredientInv.ings.forEach(obj => obj.qty = round(obj.qty * ing.qty))
              await uploadIngs(ingredientInv.ings, qtyProdus)
            }else {
              let cantFinal = parseFloat(ing.qty * qtyProdus);
              ingredientInv.qty  = round(ingredientInv.qty + cantFinal);

              if(ingredientInv.invGestiune.length){
                const gestIndex = ingredientInv.invGestiune.findIndex(g => g.gestiune.toString() === ing.gestiune.toString())
                if(gestIndex !== -1){
                  let gest = ingredientInv.invGestiune[gestIndex]
                  gest.qty = round(gest.qty + cantFinal)
  
                  const oldestEntry = gest.entries.reduce((oldest, current) => {
                    return new Date(current.date).getTime() < new Date(oldest.date).getTime() ? current : oldest;
                  });
  
                  if(oldestEntry){
                      const eIndex =  gest.entries.findIndex(g => g._id.toString() === oldestEntry._id.toString())
                      if(eIndex !== -1){
                        gest.entries[eIndex].qty = round(gest.entries[eIndex].qty + cantFinal)

                        console.log(ingredientInv.name, 'a fost încarcat cu +',  cantFinal, ' / stoc final ', gest.entries[eIndex].qty )
                      }
                  }  else {console.log('Nu au fost gasita cea mai veche gestiune')}
                  ingredientInv.invGestiune[gestIndex] = gest
                }  else {console.log('Au fost gasite gestiuni dar nu a fost gasta gestiune ingredientului ', ing.gestiune)}
              } else {console.log('Nu au fost gasite gestiuni de inventar')}


              await ingredientInv.save();
              console.log(`Success!! upload-ingredient: Nume - ${ingredientInv.name} + ${cantFinal} / stoc: ${ingredientInv.qty}`)
            }
          
            if(veggie.includes(norm(ingredientInv.name))){
              const lapte = await IngInv.findOne({name: "Lapte", locatie: ingredientInv.locatie, salePoint: ingredientInv.salePoint})
              const ingTo = {
                qty: ing.qty,
                ing: lapte._id
              }
              await unloadIngs([ingTo],  qtyProdus)
            }
      }

    }
  } catch(err){
    console.log('Eroare la incarcarea produselor in inventar', err)
  }
}



function subtractFromEntries(entries, cantFinal) {
  // sort by date ASC (oldest first)
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let remaining = cantFinal;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // on the last entry we allow negative stock
    const isLast = i === entries.length - 1;

    if (remaining <= 0) break;

    if (entry.qty >= remaining) {
      // enough to cover remaining
      entry.qty -= remaining;
      console.log('Am gasit destula cantitate in intrare / ', entry.qty,  ' / cantitate scazuta -', remaining,  '/ stoc ramas ',  entry.qty - remaining)

      if (entry.qty === 0 && !isLast) {
        console.log('Dar am consumato pe toata si am sterso')
        // delete if 0 and not the last
        entries.splice(i, 1);
        i--;        // fix index because we removed current element
      }

      remaining = 0;
    } else {
      // not enough in this entry — consume it completely
      console.log('Nu am gasit destula cantitate / ', entry.qty, ' Cantitate ce trebuie scazuta  ',  remaining)
      remaining -= entry.qty;

    if (!isLast) {
        // delete the spent entry
        entries.splice(i, 1);
        i--;        // fix index
        console.log('Am sters intrarea cu cantitate insuficienta ', entry.qty, 'cantitate ramasa pentru urmatoarea intrare', remaining )
      } else {
        console.log('Este ultima intrare, am pus cantitate negativa.  Cantitate intrare -', entry.qty, ' Cantitate vanduta  - ', remaining + entry.aqty)
        // last entry → allow negative
        entry.qty -= (remaining + entry.qty);
        remaining = 0;
      }
    }
  }

  return entries;
}




async function createProductSaleReport(billProducts, date){
    try{
      const dayDate = new Date(date)
      const hourDate = new Date(date)
      const h = dayDate.getHours()
      hourDate.setMinutes(0,0,0)
      dayDate.setHours(0,0,0,0)

      for(let product of billProducts){
        const dbProduct = await Product.findById(product.productId)
          if(!dbProduct){
            console.warn('Eroare! Produsul nu a fost gasit in baza de date la crearea raportului!', product.name)
          } else {
            let saleLog = dbProduct.saleLog 
            if(saleLog.length) {
              const dayIndex = saleLog.findIndex(d => new Date(d.date).getTime() === dayDate.getTime())
              if(dayIndex !== -1){
               const hours = saleLog[dayIndex].hours
               const hourIndex = hours.findIndex(h => new Date(h.date).getTime() === hourDate.getTime())
                if(hourIndex !== -1){ 

                  saleLog[dayIndex].hours[hourIndex].qty += product.quantity
                  saleLog[dayIndex].qty += product.quantity
                  saleLog[dayIndex].discount = round(saleLog[dayIndex].discount + product.discount)
                  saleLog[dayIndex].total = round(saleLog[dayIndex].total + ((product.quantity * product.price) - product.discount))
                } else {
                  const newHour = {
                    date: hourDate,
                    label: `${h}:01 - ${h +1}:00`,
                    qty: product.quantity
                  }
                  saleLog[dayIndex].hours.push(newHour)
                  saleLog[dayIndex].qty += product.quantity
                  saleLog[dayIndex].total = round(saleLog[dayIndex].total + ((product.quantity * product.price) - product.discount))
                }
              } else {
                const newDay = {
                  date: dayDate,
                  qty: product.quantity,
                  discount: product.discount,
                  total: round((product.quantity* product.price) - product.discount),
                  hours: [
                    {
                      date: hourDate,
                      label: `${h}:01 - ${h +1}:00`,
                      qty: product.quantity
                    }
                  ]
                }
                saleLog.push(newDay)
              }
            } else {
              const newDay = {
                date: dayDate,
                qty: product.quantity,
                discount: product.discount,
                total: round((product.quantity* product.price) - product.discount),
                hours: [
                  {
                    date: hourDate,
                    label: `${h}:01 - ${h +1}:00`,
                    qty: product.quantity
                  }
                ]
              }
              saleLog.push(newDay)
            }
            dbProduct.saleLog = saleLog
            const savedProd = await dbProduct.save()
            console.log('Logul de vanzare  a fost salvat pentru produsul',savedProd.name , savedProd._id, ' la data de ')
          }

          if(product && product.subProductId && product.subProductId.length > 6) {
            const subProduct = await SubProduct.findById(product.subProductId)
            if(!subProduct){
              console.warn('Eroare! Sub Produsul nu a fost gasit iun baza de date la crearea raportului! Dar a trecut de Id Check')
            } else {
              let saleLog = subProduct.saleLog 
              if(saleLog.length){
                const dayIndex = saleLog.findIndex(d => new Date(d.date).getTime() === dayDate.getTime())
                if(dayIndex !== -1){
                 const hours = saleLog[dayIndex].hours
                 const hourIndex = hours.findIndex(h => new Date(h.date).getTime() === hourDate.getTime())
                  if(hourIndex !== -1){ 
                    saleLog[dayIndex].hours[hourIndex].qty += product.quantity
                    saleLog[dayIndex].qty += product.quantity
                    saleLog[dayIndex].discount = round(saleLog[dayIndex].discount + product.discount)
                    saleLog[dayIndex].total = round(saleLog[dayIndex].total + ((product.quantity* product.price) - product.discount))
                  } else {
                    const newHour = {
                      date: hourDate,
                      label: `${h}:01 - ${h +1}:00`,
                      qty: product.quantity
                    }
                    saleLog[dayIndex].hours.push(newHour)
                    saleLog[dayIndex].qty += product.quantity
                    saleLog[dayIndex].total = round(saleLog[dayIndex].total + ((product.quantity * product.price) - product.discount))
                  }
                } else {
                  const newDay = {
                    date: dayDate,
                    qty: product.quantity,
                    discount: product.discount,
                    total: round((product.quantity* product.price) - product.discount),
                    hours: [
                      {
                        date: hourDate,
                        label: `${h}:01 - ${h +1}:00`,
                        qty: product.quantity
                      }
                    ]
                  }
                  saleLog.push(newDay)
                }
              } else {
                const newDay = {
                  date: dayDate,
                  qty: product.quantity,
                  discount: product.discount,
                  total: round((product.quantity* product.price) - product.discount),
                  hours: [
                    {
                      date: hourDate,
                      label: `${h}:01 - ${h +1}:00`,
                      qty: product.quantity
                    }
                  ]
                }
                saleLog.push(newDay)
                subProduct.saleLog = saleLog
              }
              const savedSubProd = await subProduct.save()
              console.log('Logul de vanzare  a fost salvat pentru sub produsul', savedSubProd.name, savedSubProd._id )
            }
          }

      }


    } catch (err){
      console.log('Eroare la salvarea raportului de vanzare a produselor', err)
    }
}











module.exports = {
    unloadIngs,
    uploadIngs,
    createProductSaleReport
}























// async function unloadIngredients(ings){
//   try{
//     let report = []

//     const updatePromises = ings.map((ing) => {
//       const ingredient = {
//         unload: ing.qty,
//         beforeUpload: ing.ing.qty,
//         afterUpload: ing.ing.qty - ing.qty,
//         um: ing.ing.um
//       }
//       report.push(ingredient)
//       return IngInv.findByIdAndUpdate(
//         ing.ing._id, 
//         { $inc: { qty: -ing.qty } }, 
//         { new: true }
//       );
//     });
//     await Promise.all(updatePromises);
//     return report;


//   } catch (err){
//     console.log('Eroare la descarcarea gestiunii', err)
//   }
// }

// const DelProd = require('../models/office/product/deletetProduct')

// async function getDeletedIngs(date, loc){
//   try{  
//       const start = new Date(date)
//       const startDate = date.setHours(0,0,0,0)
//       const endDate = date.setHours(23,59,59,9999)
//       const delProducts = await DelProd.find({locatie: loc, createdAt: {$gte: startDate, $lt: endDate}})
//       const ings = await getIngredients(delProducts)

      
//   } catch(err){
//     console.log(err)
//   }
// }




// async function getIngredients(products){
//   if(products){
//       let ingredients = []
//       for (const product of products){
//           for (const ing of product.billProduct.toppings){
//               await pushIngredients(ing, product.billProduct.quantity)
//           }
//           for(const ing of product.billProduct.ings){
//               await pushIngredients(ing, product.billproduct.quantity)
//           }
//       }
//       return ingredients


//   async function pushIngredients(inx, prodQty){
//       const ing = inx._doc
//       if(ing.ing){
//           if(ing.ing.productIngredient){
//               for (let ingx of ing.ing.ings){
//                   const ingg = ingx._doc
//                   if(ingg.ing){
//                       if(ingg.ing.productIngredient){
//                           for (let inggx of ingg.ing.ings){
//                               const inggg = inggx._doc
//                               if(inggg.ing){
//                                   const existingIng = ingredients.find(p => p.ing._id === inggg.ing._id)
//                                   if(existingIng){
//                                     existingIng.qty += (inggg.qty * prodQty * ingg.qty * ing.qty)
//                                   } else {
//                                     const ig = {...inggg}
//                                     ig.qty = round(ig.qty * prodQty * ing.qty * ingg.qty)
//                                     ingredients.push(ig)
//                                   } 
//                               }
//                           }
//                       } else {
//                           const existingIng = ingredients.find(p => p.ing._id === ingg.ing._id)
//                           if(existingIng){
//                             existingIng.qty += (prodQty * ingg.qty * ing.qty)
//                           } else {
//                             const ig = {...ingg}
//                             ig.qty = round(ig.qty * prodQty * ing.qty )
//                             ingredients.push(ig)
//                           } 
//                       } 
//                   } 
      
//               }
//           } else {
//                   const existingIng = ingredients.find(p => p.ing._id === ing.ing._id)
//                   if(existingIng){
//                     existingIng.qty += (prodQty * ing.qty)
//                   } else {
//                     const ig = {...ing}
//                     ig.qty = round(ig.qty * prodQty)
//                     ingredients.push(ig)
//                   } 
//           }
  
//       }
//   }
//   } else {
//       return null
//   }
// }
