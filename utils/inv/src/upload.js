// upload.js
const logger = require("./logger");
const { round, isVeggieMilk } = require("./utils");
const { getIngredient, saveIngredient, getMilkIngredient } = require("./db");
const { addToEntries, getOldestEntry } = require("./entries");
const { resolveGestiune, getGestiuneIndex } = require("./gestiune");
const { unloadIngs } = require("./unload");

/**
 * UPLOAD INGREDIENTS (increase stock)
 */
async function uploadIngs(ings, qtyProdus, gestiuneOverride) {
  try {

    // for (const rec of ings) {
    //   if (visited.has(rec.ing)) return;
    // }
  
    // for (const rec of ings) {
    //   visited.add(rec.ing);
    // }



    for (const ing of ings) {

      const ingredientInv = await getIngredient(ing.ing);
      if (!ingredientInv) {
        logger.error("Ingredient not found (upload):", ing.ing);
        continue;
      }


      const gestiuneId = resolveGestiune(ingredientInv, gestiuneOverride);
      const cantFinal = round(ing.qty * qtyProdus);

      // ---------------------------------------
      //   RECURSIVE PRODUCTION LOGIC
      // ---------------------------------------
      const ingsList = Array.isArray(ingredientInv.ings) ? ingredientInv.ings : [];

      if (ingsList.length > 0 && ingredientInv.production && ingredientInv.production.tehnic) {
        const subings = ingredientInv.ings.map(obj => ({
          ...obj,
          qty: round(obj.qty * ing.qty),
        }));

        await uploadIngs(subings, qtyProdus, gestiuneOverride);
        continue;
      }

      // ---------------------------------------
      //   UPDATE MAIN QTY
      // ---------------------------------------
      ingredientInv.qty = round(ingredientInv.qty + cantFinal);

      // ---------------------------------------
      //   STORE STOCK HANDLING
      // ---------------------------------------
      const gestIndex = getGestiuneIndex(ingredientInv, gestiuneId);
      if (gestIndex !== -1) {
        const gest = ingredientInv.invGestiune[gestIndex];

        gest.qty = round(gest.qty + cantFinal);

        // Update FIFO entries
        if (gest.entries.length) {
          const oldestEntry = getOldestEntry(gest.entries);

          if (oldestEntry) {
            const idx = gest.entries.findIndex(e =>
              e._id?.toString() === oldestEntry._id?.toString()
            );

            if (idx !== -1) {
              gest.entries[idx].qty = round(gest.entries[idx].qty + cantFinal);
              gest.entries[idx].date = new Date();

              logger.success(
                `${ingredientInv.name} incremented +${cantFinal}, store qty: ${gest.entries[idx].qty}`
              );
            }
          }
        }

        ingredientInv.invGestiune[gestIndex] = gest;
      }

      // ---------------------------------------
      //   SAVE RESULT
      // ---------------------------------------
      await saveIngredient(ingredientInv);

      // ---------------------------------------
      //   VEGGIE → MILK LOGIC
      // ---------------------------------------
      if (isVeggieMilk(ingredientInv.name)) {
        const lapte = await getMilkIngredient(
          ingredientInv.locatie,
          ingredientInv.salePoint
        );

        if (lapte) {
          const ingTo = { qty: ing.qty, ing: lapte._id}
          await unloadIngs([ingTo], qtyProdus, gestiuneOverride, false);
        }
      }
    }
  } catch (err) {
    logger.error("Error uploading ingredients:", err);
  }
}

module.exports = {uploadIngs};