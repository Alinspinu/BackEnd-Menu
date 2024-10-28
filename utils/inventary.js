const IngInv = require('../models/office/inv-ingredient')
const {round} = require('./functions')

const Product = require('../models/office/product/product')
const SubProduct = require('../models/office/product/sub-product')


async function unloadIngs (ings, qtyProdus) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).exec();
        if (!ingredientInv) {
            console.log(`Eorare! Ingredientul nu a fost găsit în baza de date. la descarcare de stoc`);
        } else {
          if(ingredientInv.ings.length){
            ingredientInv.ings.forEach(obj => obj.qty = round(obj.qty * ing.qty))
            await unloadIngs(ingredientInv.ings, qtyProdus)
          } else {
            let cantFinal = parseFloat(ing.qty * qtyProdus);
            ingredientInv.qty  = round(ingredientInv.qty - cantFinal);

            await ingredientInv.save();
            // console.log(`Success!! unload-ingredient: Nume - ${ingredientInv.name} - ${cantFinal} / stoc: ${ingredientInv.qty}`)
          }
            if(ingredientInv.name === "Lapte Vegetal"){
              const lapte = await IngInv.findOne({name: "Lapte"})
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

              await ingredientInv.save();
              // console.log(`Success!! upload-ingredient: Nume - ${ingredientInv.name} + ${cantFinal} / stoc: ${ingredientInv.qty}`)
            }
            if(ingredientInv.name === "Lapte Vegetal"){
              const lapte = await IngInv.findOne({name: "Lapte"})
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



async function createProductSaleReport(billProducts){
    try{
      const dayDate = new Date()
      const hourDate = new Date()
      hourDate.setMinutes(0,0,0)
      dayDate.setHours(0,0,0,0)

      for(let product of billProducts){
        const dbProduct = await Product.findById(product.productId)
          if(!dbProduct){
            console.log('Eroare! Produsul nu a fost gasit iun baza de date la crearea raportului!')
          } else {
            let saleLog = dbProduct.saleLog 
            if(saleLog.length) {
              const dayIndex = saleLog.findIndex(d => d.date.getTime() === dayDate.getTime())
              if(dayIndex !== -1){
               const hours = saleLog[dayIndex].hours
               const hourIndex = hours.findIndex(h => h.date.getTime() === hourDate.getTime())
                if(hourIndex !== -1){ 
                  saleLog[dayIndex].hours[hourIndex].qty += product.quantity
                  saleLog[dayIndex].qty += product.quantity
                } else {
                  const newHour = {
                    date: hourDate,
                    qty: product.quantity
                  }
                  saleLog[dayIndex].hours.push(newHour)
                  saleLog[dayIndex].qty += product.quantity
                }
              } else {
                const newDay = {
                  date: dayDate,
                  qty: product.quantity,
                  hours: [
                    {
                      date: hourDate,
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
                hours: [
                  {
                    date: hourDate,
                    qty: product.quantity
                  }
                ]
              }
              saleLog.push(newDay)
            }
            dbProduct.saleLog = saleLog
            const savedProd = await dbProduct.save()
            console.log('Logul de vanzare  a fost salvat pentru produsul',savedProd.name , savedProd._id)
          }

          if(product.subProductId.length > 6) {
            const subProduct = await SubProduct.findById(product.subProductId)
            if(!subProduct){
              console.log('Eroare! Sub Produsul nu a fost gasit iun baza de date la crearea raportului! Dar a trecut de Id Check')
            } else {
              const saleLog = subProduct.saleLog 
              if(saleLog.length){
                const dayIndex = saleLog.findIndex(d => d.date.getTime() === dayDate.getTime())
                if(dayIndex !== -1){
                 const hours = saleLog[dayIndex].hours
                 const hourIndex = hours.findIndex(h => h.date.getTime() === hourDate.getTime())
                  if(hourIndex !== -1){ 
                    saleLog[dayIndex].hours[hourIndex].qty += product.quantity
                    saleLog[dayIndex].qty += product.quantity
                  } else {
                    const newHour = {
                      date: hourDate,
                      qty: product.quantity
                    }
                    saleLog[dayIndex].hours.push(newHour)
                    saleLog[dayIndex].qty += product.quantity
                  }
                } else {
                  const newDay = {
                    date: dayDate,
                    qty: product.quantity,
                    hours: [
                      {
                        date: hourDate,
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
                  hours: [
                    {
                      date: hourDate,
                      qty: product.quantity
                    }
                  ]
                }
                saleLog.push(newDay)
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
