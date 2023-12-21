const IngInv = require('../models/office/inv-ingredient')
const Locatie = require('../models/office/locatie')
const {round} = require('./functions')


async function unloadIngs (ings, loc, qtyProdus) {
    for (const ing of ings) {
        const ingredientInv = await IngInv.findOne({
          name: ing.name,
          locatie: loc
        }).exec();

        if (!ingredientInv) {
          console.log(`Ingredientul ${ing.name} nu a fost găsit în baza de date. Posibil ca în rețeta produsului, ingredientul să fie trecut greșit. Verifică ingredientul ${ing.name} în nomenclator și verifică-l si în rețeta produsului. Trebuie să corespundă!`);
        } else {
            let cantFinal = parseFloat(ing.qty * qtyProdus);
            ingredientInv.qty  = round(ingredientInv.qty - cantFinal);

            if(ingredientInv.name === "Lapte Vegetal"){
                uploadIngs([{name: "Lapte", qty: ing.qty}], loc, qtyProdus)
            }
            await ingredientInv.save();
            console.log(`Success!! unload-ingredient: Nume - ${ingredientInv.name} - ${cantFinal} / stoc: ${ingredientInv.qty}`)
        }

      }
}


async function uploadIngs (ings, loc, qtyProdus) {
    for (const ing of ings) {
        const ingredientInv = await IngInv.findOne({
          name: ing.name,
          locatie: loc
        }).exec();

        if (!ingredientInv) {
          console.log(`Ingredientul ${ing.name} nu a fost găsit în baza de date. Posibil ca în rețeta produsului, ingredientul să fie trecut greșit. Verifică ingredientul ${ing.name} în nomenclator și verifică-l si în rețeta produsului. Trebuie să corespundă!`);
        } else {
            let cantFinal = parseFloat(ing.qty * qtyProdus);
            ingredientInv.qty  = round(ingredientInv.qty + cantFinal);
            if(ingredientInv.name === "Lapte Vegetal"){
                unloadIngs([{name: "Lapte", qty: ing.qty}], loc, qtyProdus)
            }
            await ingredientInv.save();
            console.log(`Success!! upload-ingredient: Nume - ${ingredientInv.name} + ${cantFinal} / stoc: ${ingredientInv.qty}`)
        }

      }
}




module.exports = {
    unloadIngs,
    uploadIngs
}