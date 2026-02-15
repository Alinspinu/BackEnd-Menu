

// production.js
const logger = require("./logger");
const { round, multiplyIngredientQuantities } = require("./utils");
const { findProductionGest } = require("./gestiune");

/** ------------------------------------------
 * PROCESS TECHNICAL PRODUCT
 * ----------------------------------------- */
async function processTechnicalProduct(ingredientInv, ing, qtyProdus, unloadFn, gestiune) {
  logger.info("Processing TECHNICAL product:", ingredientInv.name);

  const multiplied = multiplyIngredientQuantities(ingredientInv.ings, ing.qty);
  await unloadFn(multiplied, qtyProdus, gestiune, false);
}

/** ------------------------------------------
 * PROCESS COMPOUND PRODUCT
 * ----------------------------------------- */
async function processCompoundProduction(ingredientInv, ing, qtyProdus, unloadFn, gestiune) {
  logger.info("Processing COMPOUND product:", ingredientInv.name);

  if (findProductionGest(ingredientInv.invGestiune)) {
    logger.debug("Production gest found → no recursion required");
    return;
  }

  const cantFinal = round(ing.qty * qtyProdus);

  if (ingredientInv.qty <= cantFinal) {
    await unloadFn(ingredientInv.ings, ingredientInv.production.qty, gestiune);
  }
}

/** ------------------------------------------
 * DECISION LAYER
 * ----------------------------------------- */
async function processIngredientProduction(
  ingredientInv,
  ing,
  qtyProdus,
  unloadFn,
  gestiune,
  fix
) {
  // Technical → multiply + recursion
  if (ingredientInv.ings.length && ingredientInv.production?.tehnic) {
    return processTechnicalProduct(ingredientInv, ing, qtyProdus, unloadFn, gestiune);
  }

  // Non-technical compound → recursion only if allowed
  if (!fix &&
      ingredientInv.production &&
      !ingredientInv.production.tehnic &&
      ingredientInv.productIngredient) {
    return processCompoundProduction(ingredientInv, ing, qtyProdus, unloadFn, gestiune);
  }

  return;
}

module.exports = {
  processIngredientProduction,
  processTechnicalProduct,
  processCompoundProduction
};
