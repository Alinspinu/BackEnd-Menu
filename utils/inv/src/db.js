// db.js
const IngInv = require("../../../models/office/inv-ingredient"); // <-- adjust path as needed
const logger = require("./logger");

// Get ingredient by ID (with population)
async function getIngredient(id) {
  try {
    return await IngInv.findById(id)
      .populate({
        path: "ings.ing",
        select: "price tva"
      })
  } catch (err) {
    logger.error("Error fetching ingredient:", id, err);
    throw err;
  }
}

// Save ingredient safely
async function saveIngredient(ingredientInv) {
  try {
    await ingredientInv.save();
    return ingredientInv;
  } catch (err) {
    logger.error("Error saving ingredient:", ingredientInv.name, err);
    throw err;
  }
}

// Find "Lapte" ingredient for veggie milk conversion
async function getMilkIngredient(locatie, salePoint) {
  try {
    return await IngInv.findOne({
      name: "Lapte",
      locatie,
      salePoint
    });
  } catch (err) {
    logger.error("Error finding milk ingredient:", err);
    throw err;
  }
}

module.exports = {
  getIngredient,
  saveIngredient,
  getMilkIngredient
};