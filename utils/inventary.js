const IngInv = require('../models/office/inv-ingredient')
const {round} = require('./functions')


async function unloadIngs (ings, qtyProdus, operation) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).exec();
        if (!ingredientInv) {
            console.log(`Eorare! Ingredientul nu a fost găsit în baza de date. la descarcare de stoc`);
        } else {
          if(ingredientInv.ings.length){
            ingredientInv.ings.forEach(obj => obj.qty = round(obj.qty * ing.qty))
            unloadIngs(ingredientInv.ings, qtyProdus, operation)
          } else {
            let cantFinal = parseFloat(ing.qty * qtyProdus);
            ingredientInv.qty  = round(ingredientInv.qty - cantFinal);

            const date = new Date();
            date.setHours(0, 0, 0, 0, 0);
            const formattedDate = date.toISOString();

            const update = {
              date: formattedDate,
              qty: cantFinal,
              operation: operation
            }

            ingredientInv.unloadLog.push(update)
            await ingredientInv.save();
            console.log(`Success!! unload-ingredient: Nume - ${ingredientInv.name} - ${cantFinal} / stoc: ${ingredientInv.qty}`)
          }
            if(ingredientInv.name === "Lapte Vegetal"){
              const lapte = await IngInv.findOne({name: "Lapte"})
              const ingTo = {
                qty: ing.qty,
                ing: lapte._id
              }
              uploadIngs([ingTo],  qtyProdus, 'intoarcere')
            }
        }

      }
  } catch(err){
    console.log("Eroare la descarcarea prooduselor din inventar",err)
  }
}


async function uploadIngs (ings, qtyProdus, operation) {
  try{
    for (const ing of ings) {
        const ingredientInv = await IngInv.findById(ing.ing).exec();
        if (!ingredientInv) {
            console.log(`Eorare! Ingredientul nu a fost găsit în baza de date. la incarcare de stoc`);
          } else {
            if(ingredientInv.ings.length){
              ingredientInv.ings.forEach(obj => obj.qty = round(obj.qty * ing.qty))
              uploadIngs(ingredientInv.ings, qtyProdus, operation)
            }else {
              let cantFinal = parseFloat(ing.qty * qtyProdus);
              ingredientInv.qty  = round(ingredientInv.qty + cantFinal);

              const date = new Date();
              date.setHours(0, 0, 0, 0, 0);
              const formattedDate = date.toISOString();

              const update = {
                  date: formattedDate,
                  qty: cantFinal,
                  operation: operation
              }
            
              ingredientInv.uploadLog.push(update)

              await ingredientInv.save();
              console.log(`Success!! upload-ingredient: Nume - ${ingredientInv.name} + ${cantFinal} / stoc: ${ingredientInv.qty}`)
            }
            if(ingredientInv.name === "Lapte Vegetal"){
              const lapte = await IngInv.findOne({name: "Lapte"})
              const ingTo = {
                qty: ing.qty,
                ing: lapte._id
              }
              unloadIngs([ingTo],  qtyProdus, 'intoarcere')
            }
      }

    }
  } catch(err){
    console.log('Eroare la incarcarea produselor in inventar', err)
  }
}



module.exports = {
    unloadIngs,
    uploadIngs
}