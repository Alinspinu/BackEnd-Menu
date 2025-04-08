const express = require('express');
const router = express.Router();

const ingRoutes = require('../../controlers/back-office/ing')
const printRoutes = require('../../controlers/print')
const depsRoutes = require('../../controlers/back-office/deps')


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

router.route('/compare-inv').post(ingRoutes.compareScriptic)

router.route('/update').get(ingRoutes.updateStoc)
router.route('/ing').get(ingRoutes.getIng)

router.route('/smoke')
    .get(ingRoutes.getLastCigSheet)
    .post(ingRoutes.saveCigSheet)
    .put(ingRoutes.updateCigarsSheet)

router.route('/log')
        .get(ingRoutes.getIngUploadLog)
        .delete(ingRoutes.deleteIngUpLog)

router.route('/dep')
        .get(depsRoutes.getDep)
        .post(depsRoutes.addDep)
        .put(depsRoutes.editDep)
        .delete(depsRoutes.deleteDep)

router.route('/gest')
    .get(depsRoutes.getGest)
    .post(depsRoutes.addGest)
    .put(depsRoutes.editGest)
    .delete(depsRoutes.deleteGest)

// router.route('/fix').get(ingRoutes.fixbuBulealaOvi)

// router.route('/update-log').get(ingRoutes.updateUploadLog)

module.exports = router
