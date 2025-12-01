const IngInv = require('../models/office/inv-ingredient')
const {round} = require('./functions')

const Product = require('../models/office/product/product')
const SubProduct = require('../models/office/product/sub-product');
const Inventary = require('../models/office/inventary')


const norm = s => s?.trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const veggie = ['lapte vegetal', 'lapte mazare', 'lapte ovaz' ]

async function unloadIngs (ings, qtyProdus) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).populate({path: 'ings.ing', select: 'price tva'}).exec();
        if (!ingredientInv) {
            console.error(`Eorare! Ingredientul nu a fost găsit în baza de date. la descarcare de stoc`);
        } else {
          if(ingredientInv.ings.length && ingredientInv.production.tehnic){
            ingredientInv.ings.forEach(obj => {
              obj.qty = round(obj.qty * ing.qty)
            })
            await unloadIngs(ingredientInv.ings, qtyProdus)
          } else {
            let cantFinal = parseFloat(ing.qty * qtyProdus);
            if(ingredientInv.production && !ingredientInv.production.tehnic && ingredientInv.productIngredient){
                console.log('Am gasit ingredient compus cu gestiune...')
                  if(ingredientInv.qty <= cantFinal){
                    const diference = cantFinal - ingredientInv.qty
                    ingredientInv.uploadLog.push(
                      {
                        date: new Date(), 
                        qty: ingredientInv.production.qty, 
                        uploadNoVat: calcRecipeTotal(ingredientInv.ings).price,
                        uploadPrice: calcRecipeTotal(ingredientInv.ings).priceNoVat,
                        operation: {name: 'intrare', details: 'Intrare prin productie'}})
                    ingredientInv.qty = round(ingredientInv.production.qty - diference)
                    await unloadIngs(ingredientInv.ings, ingredientInv.production.qty)
                  }
            }


            ingredientInv.qty  = round(ingredientInv.qty - cantFinal);
            const inventary = await  Inventary
                                .findOne({date: {$gte: new Date()}, gestiune: ing.gestiune})
                                .sort({ date: 1 }); 
              if(inventary){
                const gest = ingredientInv.invGestiune.find(g => g.gestiune._id.toString() === inventary.gestiune.toString())
                if(gest && gest.entries.length){        
                  const lastEntry = gest.entries.reduce((oldest, current) => {
                    return new Date(current.date).getTime() > new Date(oldest.date).getTime() ? current : oldest;
                  });  
                  inventary.scripticValue = round(Number(inventary.scripticValue) || 0 - (lastEntry.priceWithVat * cantFinal))
                }
                console.log('AM gasit un inventar inregistrat dupa data vanzarii')
                console.log('Cautare ingredient in inventar...')
                const ingI = inventary.ingredients.find(i => i.ing.toString() === ing.ing.toString())
                if(ingI){
                console.log('Ingredient gasit ', ingI.name)
                console.log('Cantitate ingredient ', ingI.scriptic, ingI.um)
                console.log('Cantitate de scazut ', cantFinal, ingI.um)
                ingI.scriptic = round(ingI.scriptic - cantFinal)
                console.log('Cantitate modificata ', ingI.scriptic)
                await inventary.save()
                console.log('Inventar modificat cu success!!')
              } else {console.warn('Nu am gasit ingredientul in inventar ',  ing.ing.toString())}
    
              } 



            if(ingredientInv.invGestiune.length){
              const gestIndex = ingredientInv.invGestiune.findIndex(g => g.gestiune?.toString() === ing.gestiune?.toString())
              if(gestIndex !== -1){
                const gest = ingredientInv.invGestiune[gestIndex];
                console.log('Procesare.... ', ingredientInv.name)
                if(ingredientInv.production && !ingredientInv.production.tehnic && ingredientInv.productIngredient){
                  console.log('Am gasit produs ingredient NO TEHNIC')
                  if(gest.qty <= cantFinal){
                    const diference = cantFinal - gest.qty
                    gest.qty = round(ingredientInv.production.qty - diference)
                    if(gest.entries.length){
                      if(gest.entries.length === 1){
                        const prices = calcRecipeTotal(ingredientInv.ings)
                        gest.entries[0].qty = gest.qty
                        gest.entries[0].date = new Date()
                        gest.entries[0].priceNoVat = prices.price
                        gest.entries[0].priceWithVat = prices.vatPrice
                      } else {console.log('!!!!!Au fost gasite mai multe intrari pe gesiunea ingredientului compus ', gest.entries )}
                    } else {
                      const entry = {
                        qty: gest.qty,
                        inQty: ingredientInv.production.qty ,
                        date: new Date(),
                        priceNoVat: ingredientInv.price,
                        priceWithVat: ingredientInv.price,
                        suplierNmae: 'Productie interna',
                      }
                      gest.entries.push(entry)
                    }
                  } else {
                    gest.qty = round(gest.qty - cantFinal);
                    if(gest.entries.length){
                      gest.entries = subtractFromEntries(gest.entries, cantFinal);
                      const oldestEntry = gest.entries.reduce((oldest, current) => {
                        return new Date(current.date).getTime() < new Date(oldest.date).getTime() ? current : oldest;
                      });
                      if(oldestEntry){
                        if(oldestEntry.priceNoVat > 0){
                          ingredientInv.price = oldestEntry.priceNoVat
                          ingredientInv.tvaPrice = oldestEntry.priceWithVat
                          ingredientInv.transportPrice = oldestEntry.transportPrice
                        } else {
                          oldestEntry.priceNoVat = ingredientInv.price 
                          oldestEntry.priceWithVat = ingredientInv.tvaPrice 
                        }
                        console.log('Am am acualizat pretul ingredientului dupa ultima intrare ', ingredientInv.tvaPrice)
                      } else {console.warn('!!!!!Atentie nu am gasit ultima intrare pretul ingredientului a ramas acelasi!')}
                    } else {
                      console.log('!!!!Atentie nu au fost gasite intrari in gestiune, cantitatea a fost scazuta din principal!, stoc final ', gest.qty)
                    }
                  }

                } else {

                  gest.qty = round(gest.qty - cantFinal);
                  if(gest.entries.length){
                    gest.entries = subtractFromEntries(gest.entries, cantFinal);
                    const oldestEntry = gest.entries.reduce((oldest, current) => {
                      return new Date(current.date).getTime() < new Date(oldest.date).getTime() ? current : oldest;
                    });
                    if(oldestEntry){
                      if(oldestEntry.priceNoVat > 0){
                        ingredientInv.price = oldestEntry.priceNoVat
                        ingredientInv.tvaPrice = oldestEntry.priceWithVat
                        ingredientInv.transportPrice = oldestEntry.transportPrice
                      } else {
                        oldestEntry.priceNoVat = ingredientInv.price 
                        oldestEntry.priceWithVat = ingredientInv.tvaPrice 
                      }
                      console.log('Am am acualizat pretul ingredientului dupa ultima intrare ', ingredientInv.tvaPrice)
                    } else {console.warn('!!!!!Atentie nu am gasit ultima intrare pretul ingredientului a ramas acelasi!')}
                  } else {
                    console.log('!!!!Atentie nu au fost gasite intrari in gestiune, cantitatea a fost scazuta din principal!, stoc final ', gest.qty)
                  }

                }

                ingredientInv.invGestiune[gestIndex] = gest
              }  else {console.warn('Au fost gasite gestiuni dar nu a fost gasta gestiune ingredientului ', ing.gestiune)}
            } else {console.warn('Nu au fost gasite gestiuni de inventar')}

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

function calcRecipeTotal(ings) {

  let priceWithVat = 0
  let priceNoVat = 0
  ings.forEach((ing) => {
    const price = ing.ing.price
    const tva = ing.ing.tva / 100
    const priceWithTva = price + price * tva
    priceWithVat = priceWithVat + (priceWithTva * ing.qty)
    priceNoVat += (price * ing.qty)
  })
  return {vatPrice: round(priceWithVat), price: round(priceNoVat)}
}


async function uploadIngs (ings, qtyProdus) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).populate({path: 'ings.ing', select: 'price tva'}).exec();
        if (!ingredientInv) {
            console.error(`Eorare! Ingredientul nu a fost găsit în baza de date. la incarcare de stoc`);
          } else {
            if(ingredientInv.ings.length && ingredientInv.production.tehnic){
              ingredientInv.ings.forEach(obj => obj.qty = round(obj.qty * ing.qty))
              await uploadIngs(ingredientInv.ings, qtyProdus)
            }else {
              let cantFinal = parseFloat(ing.qty * qtyProdus);
              ingredientInv.qty  = round(ingredientInv.qty + cantFinal);
              
              const inventary = await  Inventary
                                .findOne({date: {$gte: new Date()}, gestiune: ing.gestiune})
                                .sort({ date: 1 }); 
                if(inventary){
                  const gest = ingredientInv.invGestiune.find(g => g.gestiune._id.toString() === inventary.gestiune.toString())
                  if(gest && gest.entries.length){        
                    const lastEntry = gest.entries.reduce((oldest, current) => {
                      return new Date(current.date).getTime() > new Date(oldest.date).getTime() ? current : oldest;
                    });  
                    inventary.scripticValue = round(Number(inventary.scripticValue) || 0 + (lastEntry.priceWithVat * cantFinal))
                  }
                  console.log('AM gasit un inventar inregistrat dupa data incarcarii')
                  console.log('Cautare ingredient in inventar...')
                  const ingI = inventary.ingredients.find(i => i.ing.toString() === ing.ing.toString())
                  if(ingI){
                  console.log('Ingredient gasit ', ingI.name)
                  console.log('Cantitate ingredient ', ingI.scriptic, ingI.um)
                  console.log('Cantitate de adaugat ', cantFinal, ingI.um)
                  ingI.scriptic = round(ingI.scriptic + cantFinal)
                  console.log('Cantitate modificata ', ingI.scriptic)
                  await inventary.save()
                  console.log('Inventar modificat cu success!!')
                } else {console.warn('Nu am gasit ingredientul in inventar ',  ing.ing.toString())}

                } 


              if(ingredientInv.invGestiune.length){
                const gestIndex = ingredientInv.invGestiune.findIndex(g => g.gestiune?.toString() === ing.gestiune?.toString())
                if(gestIndex !== -1){
                  let gest = ingredientInv.invGestiune[gestIndex]
                  gest.qty = round(gest.qty + cantFinal)
                  
                  if(gest.entries.length){
                    const oldestEntry = gest.entries.reduce((oldest, current) => {
                      return new Date(current.date).getTime() < new Date(oldest.date).getTime() ? current : oldest;
                    });
    
                    if(oldestEntry){
                        const eIndex =  gest.entries.findIndex(g => g._id.toString() === oldestEntry._id.toString())
                        if(eIndex !== -1){
                          gest.entries[eIndex].qty = round(gest.entries[eIndex].qty + cantFinal)
  
                          console.log(ingredientInv.name, 'a fost încarcat cu +',  cantFinal, ' / stoc final ', gest.entries[eIndex].qty )
                        }
                    }  else { console.warn('!!!!Atentie nu au fost gasite intrari in gestiune, cantitatea a fost incarcata doar in principal!, stoc final ', gest.qty)}
                  }
                  ingredientInv.invGestiune[gestIndex] = gest
                }  else {console.warn('Au fost gasite gestiuni dar nu a fost gasta gestiune ingredientului ', ing.gestiune)}
              } else {console.warn('Nu au fost gasite gestiuni de inventar')}


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
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log('Cantitate ce trebuie scazuta din document', cantFinal)
  let remaining = cantFinal;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    const isLast = i === entries.length - 1;

    if (remaining <= 0) break;

    if (entry.qty >= remaining) {

      entry.qty -= remaining;
      console.log('Am gasit destula cantitate in intrare / ', entry.qty, '/ stoc ramas ',  entry.qty - remaining)

      if (entry.qty === 0 && !isLast) {
        console.log('Dar am consumato pe toata si am sterso')
        entries.splice(i, 1);
        i--;    
      }

      remaining = 0;
    } else {
      console.warn('Nu am gasit destula cantitate / ', entry.qty, ' Cantitate ce trebuie scazuta  ',  remaining)
      remaining -= entry.qty;

    if (!isLast) {
        entries.splice(i, 1);
        i--;     
        console.log('Am sters intrarea cu cantitate insuficienta ', entry.qty, 'cantitate ramasa pentru urmatoarea intrare', remaining )
      } else {
        console.log('Este ultima intrare, am pus cantitate negativa.  Cantitate intrare -', entry.qty, ' Cantitate vanduta  - ', remaining + entry.qty)
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
