const IngInv = require('../models/office/inv-ingredient')
const {round} = require('./functions')


async function unloadIngs (ings, qtyProdus) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).exec();
        if (!ingredientInv) {
            console.log(`Eorare! Ingredientul nu a fost găsit în baza de date. la descarcare de stoc`);
        } else {
          if(ingredientInv.ings.length){
            ingredientInv.ings.forEach(obj => obj.qty = round(obj.qty * ing.qty))
            unloadIngs(ingredientInv.ings, qtyProdus)
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
              uploadIngs([ingTo],  qtyProdus)
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
              uploadIngs(ingredientInv.ings, qtyProdus)
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
              unloadIngs([ingTo],  qtyProdus)
            }
      }

    }
  } catch(err){
    console.log('Eroare la incarcarea produselor in inventar', err)
  }
}


async function unloadIngredients(ings){
  try{
    let report = []

    const updatePromises = ings.map((ing) => {
      const ingredient = {
        unload: ing.qty,
        beforeUpload: ing.ing.qty,
        afterUpload: ing.ing.qty - ing.qty,
        um: ing.ing.um
      }
      report.push(ingredient)
      return IngInv.findByIdAndUpdate(
        ing.ing._id, 
        { $inc: { qty: -ing.qty } }, 
        { new: true }
      );
    });
    await Promise.all(updatePromises);
    return report;


  } catch (err){
    console.log('Eroare la descarcarea gestiunii', err)
  }
}

const DelProd = require('../models/office/product/deletetProduct')

async function getDeletedIngs(date, loc){
  try{  
      const start = new Date(date)
      const startDate = date.setHours(0,0,0,0)
      const endDate = date.setHours(23,59,59,9999)
      const delProducts = await DelProd.find({locatie: loc, createdAt: {$gte: startDate, $lt: endDate}})
      const ings = await getIngredients(delProducts)

      
  } catch(err){
    console.log(err)
  }
}




async function getIngredients(products){
  if(products){
      let ingredients = []
      for (const product of products){
          for (const ing of product.billProduct.toppings){
              await pushIngredients(ing, product.billProduct.quantity)
          }
          for(const ing of product.billProduct.ings){
              await pushIngredients(ing, product.billproduct.quantity)
          }
      }
      return ingredients


  async function pushIngredients(inx, prodQty){
      const ing = inx._doc
      if(ing.ing){
          if(ing.ing.productIngredient){
              for (let ingx of ing.ing.ings){
                  const ingg = ingx._doc
                  if(ingg.ing){
                      if(ingg.ing.productIngredient){
                          for (let inggx of ingg.ing.ings){
                              const inggg = inggx._doc
                              if(inggg.ing){
                                  const existingIng = ingredients.find(p => p.ing._id === inggg.ing._id)
                                  if(existingIng){
                                    existingIng.qty += (inggg.qty * prodQty * ingg.qty * ing.qty)
                                  } else {
                                    const ig = {...inggg}
                                    ig.qty = round(ig.qty * prodQty * ing.qty * ingg.qty)
                                    ingredients.push(ig)
                                  } 
                              }
                          }
                      } else {
                          const existingIng = ingredients.find(p => p.ing._id === ingg.ing._id)
                          if(existingIng){
                            existingIng.qty += (prodQty * ingg.qty * ing.qty)
                          } else {
                            const ig = {...ingg}
                            ig.qty = round(ig.qty * prodQty * ing.qty )
                            ingredients.push(ig)
                          } 
                      } 
                  } 
      
              }
          } else {
                  const existingIng = ingredients.find(p => p.ing._id === ing.ing._id)
                  if(existingIng){
                    existingIng.qty += (prodQty * ing.qty)
                  } else {
                    const ig = {...ing}
                    ig.qty = round(ig.qty * prodQty)
                    ingredients.push(ig)
                  } 
          }
  
      }
  }
  } else {
      return null
  }
}



module.exports = {
    unloadIngs,
    uploadIngs
}