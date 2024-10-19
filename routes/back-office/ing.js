const express = require('express');
const router = express.Router();

const ingRoutes = require('../../controlers/back-office/ing')
const printRoutes = require('../../controlers/print')
router.route('/search-ingredients').get(ingRoutes.searchIng);
router.route('/ingredient')
    .post(ingRoutes.saveIng)
    .put(ingRoutes.editIng)
    .delete(ingRoutes.deleteIng)

router.route('/print-ing-list').post(printRoutes.createIngredientsInvXcel)
router.route('/print-consum').post(printRoutes.printConsum)
router.route('/save-inventary').get(ingRoutes.saveInventary)
router.route('/save-faptic').post(ingRoutes.saveManualInventary)
router.route('/save-inv').post(ingRoutes.saveInv)
router.route('/update-ingredient-quantity').post(ingRoutes.updateIngredientQuantity)

router.route('/get-consumabil').get(ingRoutes.getIngConsumabil)
router.route('/get-inventary').get(ingRoutes.getInventary)

router.route('/update').get(ingRoutes.updateStoc)

module.exports = router
