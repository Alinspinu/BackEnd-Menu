// gestiune.js
const logger = require("./logger");

// Find gest entry index inside ingredientInv.invGestiune
function getGestiuneIndex(ingredientInv, gestiuneId) {

  const invGestiune = Array.isArray(ingredientInv.invGestiune)
  ? ingredientInv.invGestiune
  : (ingredientInv.invGestiune = []);

  if (!invGestiune || !invGestiune.length) {
    logger.warn("No inventory stores (invGestiune) found for ingredient:", ingredientInv.name);
    return -1;
  }

  return ingredientInv.invGestiune.findIndex(g =>
    g.gestiune?.toString() === gestiuneId?.toString()
  );
}

// Find production gest (original logic preserved)
function findProductionGest(gests) {
  return gests.some(g => !g.sale);
}

// Get gestiune id to use
// OPTION A: if external gestiune provided → always overrides ingredientInv.gestiune
function resolveGestiune(ingredientInv, gestiuneOverride) {
  if (gestiuneOverride) return gestiuneOverride.toString();
  return ingredientInv.gestiune.toString();
}

module.exports = {
  getGestiuneIndex,
  findProductionGest,
  resolveGestiune
};