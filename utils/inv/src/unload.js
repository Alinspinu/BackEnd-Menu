// unload.js
const logger = require("./logger");
const { round, calcRecipeTotal, isVeggieMilk } = require("./utils");
const { getIngredient, saveIngredient, getMilkIngredient } = require("./db");
const { subtractFromEntries, getOldestEntry } = require("./entries");
const { resolveGestiune, getGestiuneIndex, findProductionGest } = require("./gestiune");
const { processIngredientProduction } = require("./production");
const service = require('./service')
// const { uploadIngs } = require("./upload");

/**
 * UNLOAD INGREDIENTS
 *
 * @param {Array} ings - ingredient list [{ing, qty}]
 * @param {Number} qtyProdus - product qty
 * @param {String} gestiuneOverride - store override
 * @param {Boolean} fix - disable compound recursion
 */
async function unloadIngs(ings, qtyProdus, gestiuneOverride, fix = false) {
  try {



    for (const ing of ings) {
      const ingredientInv = await getIngredient(ing.ing);
      if (!ingredientInv) {
        logger.error("Ingredient not found (unload):", ing);
        continue;
      }

      const gestiuneId = resolveGestiune(ingredientInv, gestiuneOverride);
      const cantFinal = round(ing.qty * qtyProdus);

      // ---------------------------------------
      //   HANDLE PRODUCTION (RECURSION)
      // ---------------------------------------
      await processIngredientProduction(
        ingredientInv,
        ing,
        qtyProdus,
        unloadIngs,
        gestiuneOverride,
        fix
      );

      // ---------------------------------------
      //   UNLOAD MAIN QTY
      // ---------------------------------------
      if (
        ingredientInv.production &&
        !ingredientInv.production.tehnic &&
        ingredientInv.productIngredient &&
        !findProductionGest(ingredientInv.invGestiune, gestiuneId) &&
        !fix
      ) {
        if (ingredientInv.qty <= cantFinal) {
          const difference = cantFinal - ingredientInv.qty;

          const uploadLog = Array.isArray(ingredientInv.uploadLog)
          ? ingredientInv.uploadLog
          : (ingredientInv.uploadLog = []);

          const ings = Array.isArray(ingredientInv.ings) ? ingredientInv.ings : [];

          const recipeTotals = calcRecipeTotal(ings);

          uploadLog.push({
            date: new Date(),
            qty: ingredientInv.production.qty,
            uploadNoVat: recipeTotals.price,
            uploadPrice: recipeTotals.vatPrice,
            operation: {
              name: "intrare",
              details: "Intrare prin productie"
            }
          });

          ingredientInv.uploadLog = uploadLog

          ingredientInv.qty = round(ingredientInv.production.qty - difference);
          console.log('Hit insuficint sock for ingredient', ingredientInv.name)
          // Recursive unload for compound items
          await unloadIngs(
            ingredientInv.ings,
            ingredientInv.production.qty,
            gestiuneOverride,
            false,
          );
        } else {
          ingredientInv.qty = round(ingredientInv.qty - cantFinal);
          console.log('Hit normal stock unloasd for ingredient', ingredientInv.name)
        }
      } else {
        ingredientInv.qty = round(ingredientInv.qty - cantFinal);
        console.log('Hit seconf if', ingredientInv.name)
      }

      // ---------------------------------------
      //   HANDLE STORE STOCK (invGestiune)
      // ---------------------------------------
      const gestIndex = getGestiuneIndex(ingredientInv, gestiuneId);
      if (gestIndex !== -1) {
        const gest = ingredientInv.invGestiune[gestIndex];

        gest.qty = round(gest.qty - cantFinal);

        // FIFO subtraction on entries
        if (gest.entries?.length) {
          gest.entries = subtractFromEntries(gest.entries, cantFinal);

          const oldestEntry = getOldestEntry(gest.entries);
          if (oldestEntry) {
            if (oldestEntry.priceNoVat > 0) {
              ingredientInv.price = oldestEntry.priceNoVat;
              ingredientInv.tvaPrice = oldestEntry.priceWithVat;
              ingredientInv.transportPrice = oldestEntry.transportPrice;
            } else {
              oldestEntry.priceNoVat = ingredientInv.price;
              oldestEntry.priceWithVat = ingredientInv.tvaPrice;
            }
          }
        }

        ingredientInv.invGestiune[gestIndex] = gest;
      }

      // ---------------------------------------
      //   SAVE INGREDIENT
      // ---------------------------------------
      await saveIngredient(ingredientInv);
      logger.success(
        `Unloaded ingredient: ${ingredientInv.name}, qty -${cantFinal}, stock: ${ingredientInv.qty}`
      );

      // ---------------------------------------
      //   VEGGIE → MILK CONVERSION
      // ---------------------------------------
      if (isVeggieMilk(ingredientInv.name)) {
        const lapte = await getMilkIngredient(
          ingredientInv.locatie,
          ingredientInv.salePoint
        );

        if (lapte) {
          const ingTo = { qty: ing.qty, ing: lapte._id };
          // await uploadIngs([ingTo], qtyProdus, gestiuneOverride);
          await service.uploadIngs([ingTo], qtyProdus, gestiuneOverride);
        }
      }
    }
  } catch (err) {
    logger.error("Error unloading ingredients:", err);
  }
}

service.unloadIngs = unloadIngs

module.exports = {unloadIngs}