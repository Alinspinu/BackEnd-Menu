// utils/inv/src/gestTransfer.js
const logger = require("./logger");
const { round } = require("./utils");
const { getIngredient, saveIngredient } = require("./db");
const { subtractFromEntries } = require("./entries");
const { getGestiuneIndex } = require("./gestiune");

/**
 * TRANSFER BETWEEN GESTIUNI
 * Moves qty from one gestiune to another on the same ingredient.
 */
async function gestTransfer(ings, sendGest, receiveGest) {
  try {
    for (const ing of ings) {
      const ingredientInv = await getIngredient(ing.ing);

      if (!ingredientInv) {
        logger.error("Ingredient not found (gestTransfer):", ing.ing);
        continue;
      }

      const sIndex = getGestiuneIndex(ingredientInv, sendGest);
      const rIndex = getGestiuneIndex(ingredientInv, receiveGest);

      if (sIndex === -1) {
        logger.error(
          `Transfer ERROR: gestiunea de plecare ${sendGest} nu există pe ingredient ${ingredientInv.name}`
        );
        continue;
      }
      if (rIndex === -1) {
        logger.error(
          `Transfer ERROR: gestiunea destinatar ${receiveGest} nu există pe ingredient ${ingredientInv.name}`
        );
        continue;
      }

      const sGest = ingredientInv.invGestiune[sIndex];
      const rGest = ingredientInv.invGestiune[rIndex];

      const qty = round(ing.qty);

      if (sGest.qty < qty) {
        logger.error(
          `Transfer ERROR: gestiunea ${sGest.name} nu are destul stoc pentru ${ingredientInv.name}`
        );
        continue;
      }

      // ---------------------------------------------
      // 1️⃣ SUBTRACT FROM SOURCE (FIFO)
      // ---------------------------------------------
      sGest.qty = round(sGest.qty - qty);
      if (sGest.entries?.length) {
        sGest.entries = subtractFromEntries(sGest.entries, qty);
      }

      // ---------------------------------------------
      // 2️⃣ ADD TO DESTINATION (new FIFO entry)
      // ---------------------------------------------
      rGest.qty = round(rGest.qty + qty);

      rGest.entries.push({
        qty,
        inQty: qty,
        date: new Date(),
        priceNoVat: ing.price || ingredientInv.price || 0,
        priceWithVat:
          ing.price
            ? round(ing.price * (1 + (ingredientInv.tva || 0) / 100))
            : ingredientInv.tvaPrice || 0,
        supplierName: `Transfer din gestiunea ${sendGest}`
      });

      ingredientInv.invGestiune[sIndex] = sGest;
      ingredientInv.invGestiune[rIndex] = rGest;

      // ---------------------------------------------
      // 3️⃣ SAVE RESULT
      // ---------------------------------------------
      await saveIngredient(ingredientInv);

      logger.success(
        `Transfer: ${qty} din ${sendGest} → ${receiveGest} pentru ${ingredientInv.name}`
      );
    }
  } catch (err) {
    logger.error("Error during gestiune transfer:", err);
  }
}

module.exports = { gestTransfer };
