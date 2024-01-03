const express = require('express');
const router = express.Router();

const ingRoutes = require('../../controlers/back-office/ing')

router.route('/search-ingredients').post(ingRoutes.searchIng);
router.route('/ingredient')
    .post(ingRoutes.saveIng)
    .put(ingRoutes.editIng)
    .delete(ingRoutes.deleteIng)
router.route('/product-ing')
    .post(ingRoutes.addProdIng)
    .put(ingRoutes.editProdIng)
    .delete(ingRoutes.deleteIng)




module.exports = router