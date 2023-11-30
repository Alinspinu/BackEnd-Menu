const express = require('express');
const router = express.Router();
const officeRoutes = require('../controlers/back-office')
const printRoutes = require('../controlers/print')

router.route('/save-suplier').post(officeRoutes.addSuplier);
router.route('/send-supliers').post(officeRoutes.sendSuplier);
router.route('/save-nir').post(officeRoutes.saveNir);
router.route('/print-nir').get(printRoutes.printNir);
router.route('/search-ingredients').post(officeRoutes.searchIng)
router.route('/save-ingredient').post(officeRoutes.saveIng)
router.route('/get-products').post(officeRoutes.getProducts)
router.route('/get-product').get(officeRoutes.getProduct)



module.exports = router