const express = require('express');
const router = express.Router();
const nutritionRoutes = require('../controlers/nutrition')


router.route('/get-fat-token').get(nutritionRoutes.getToken);
router.route('/ing-add')
    .post(nutritionRoutes.saveIngredient)
    .put(nutritionRoutes.editIngredient);
router.route('/ing-send').get(nutritionRoutes.sendIngredients);
router.route('/add-ing-to-product').post(nutritionRoutes.saveIngredientsToProduct);
router.route('/add-prod-ing').post(nutritionRoutes.saveProductIngredient);
router.route('/delete-ingredient').delete(nutritionRoutes.deleteIngredient);

module.exports = router;