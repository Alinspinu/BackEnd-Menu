// utils.js
const logger = require("./logger");

// Normalize string (remove accents, lowercase)
function norm(s) {
  return s?.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Round to 2 decimals everywhere
function round(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

// Ingredients that trigger milk substitution
const VEGGIE_LIST = ["lapte vegetal", "lapte mazare", "lapte ovaz", 'lapte vegetal de mazare', 'lapte vegetal de ovaz', 'lapte vegetal de cocos'];

// Check if ingredient is a veggie milk
function isVeggieMilk(name) {
  return VEGGIE_LIST.includes(norm(name));
}

// Calculate total price of recipe ingredients
function calcRecipeTotal(ings) {
  let priceWithVat = 0;
  let priceNoVat = 0;

  ings.forEach((ing) => {
    const price = ing.ing.price;
    const vatFactor = 1 + (ing.ing.tva / 100);
    const priceVat = price * vatFactor;

    priceWithVat += priceVat * ing.qty;
    priceNoVat += price * ing.qty;
  });

  return {
    vatPrice: round(priceWithVat),
    price: round(priceNoVat)
  };
}

// Multiply sub-ingredient quantities for technical products
function multiplyIngredientQuantities(ings, factor) {
  return ings.map(obj => ({
    ...(typeof obj.toObject === "function" ? obj.toObject() : obj),
    qty: round(obj.qty * factor)
  }));
}

module.exports = {
  norm,
  round,
  calcRecipeTotal,
  multiplyIngredientQuantities,
  isVeggieMilk,
  VEGGIE_LIST
};