const express = require('express');
const router = express.Router();

const ingRoutes = require('../../controlers/back-office/ing')
const printRoutes = require('../../controlers/print')
router.route('/search-ingredients').post(ingRoutes.searchIng);
router.route('/ingredient')
    .post(ingRoutes.saveIng)
    .put(ingRoutes.editIng)
    .delete(ingRoutes.deleteIng)

router.route('/print-ing-list').post(printRoutes.createIngredientsInvXcel)
router.route('/print-consum').post(printRoutes.printConsum)





module.exports = router