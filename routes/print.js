const express = require('express');
const router = express.Router();

const printRoutes = require('../controlers/print')


router.route('/products').post(printRoutes.saleProducts)
router.route('/consumption').post(printRoutes.printConsumption)
router.route('/production').post(printRoutes.printProduction)
router.route('/inventary').get(printRoutes.printInventary)
router.route('/report').post(printRoutes.report)


module.exports = router